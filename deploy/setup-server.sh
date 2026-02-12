#!/bin/bash
set -euo pipefail

# ============================================================
# Morren Marketplace - Production Server Setup Script
# Run on a fresh Ubuntu 24.04 LTS DigitalOcean Droplet
# Usage: sudo bash setup-server.sh
#
# PRODUCTION HARDENED:
#  - PostgreSQL WAL archiving (continuous point-in-time recovery)
#  - Swap file for OOM protection
#  - Disk space & health monitoring cron
#  - Log rotation for all app + backup logs
#  - fail2ban SSH brute-force protection
#  - Automatic unattended security updates
#  - PostgreSQL connection hardening (md5 auth, local only)
#  - .pgpass for passwordless backup scripts
# ============================================================

# --- Configuration (edit these before running) ---
APP_USER="morren"
APP_DIR="/opt/morren"
DB_NAME="morren_db"
DB_USER="morren_user"
DB_PASSWORD=""  # Will prompt if empty
DOMAIN=""       # Will prompt if empty
SPACES_ACCESS_KEY=""  # Will prompt if empty
SPACES_SECRET_KEY=""  # Will prompt if empty
SPACES_BUCKET="morren-backups"
SPACES_REGION="nyc3"  # Change to your Spaces region

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Pre-checks ---
if [ "$EUID" -ne 0 ]; then
  err "Please run as root: sudo bash setup-server.sh"
fi

# --- Prompt for missing values ---
if [ -z "$DB_PASSWORD" ]; then
  read -sp "Enter PostgreSQL password for '$DB_USER': " DB_PASSWORD
  echo
  [ -z "$DB_PASSWORD" ] && err "Database password cannot be empty"
  read -sp "Confirm password: " DB_PASSWORD_CONFIRM
  echo
  [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ] && err "Passwords do not match"
fi

if [ -z "$DOMAIN" ]; then
  read -p "Enter your domain name (or press Enter to use droplet IP): " DOMAIN
fi

# Detect if using IP or domain
USE_IP_MODE=false
SERVER_ADDR="$DOMAIN"
if [ -z "$DOMAIN" ]; then
  USE_IP_MODE=true
  SERVER_ADDR=$(curl -s -4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
  log "No domain provided. Using droplet IP: $SERVER_ADDR"
  log "You can add a domain + SSL later by running: certbot --nginx -d yourdomain.com"
fi

if [ -z "$SPACES_ACCESS_KEY" ]; then
  read -p "Enter DigitalOcean Spaces Access Key (leave empty to skip backup setup): " SPACES_ACCESS_KEY
fi

# ============================================================
# 1. System Update & Essential Packages
# ============================================================
log "Updating system packages..."
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git build-essential software-properties-common \
  ufw fail2ban unzip htop logrotate mailutils unattended-upgrades apt-listchanges

# ============================================================
# 2. Enable Automatic Security Updates
# ============================================================
log "Enabling automatic security updates..."
cat > /etc/apt/apt.conf.d/20auto-upgrades << 'AUTOUPGRADE_EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
AUTOUPGRADE_EOF
log "Unattended security upgrades enabled"

# ============================================================
# 3. Create Swap File (OOM protection)
# ============================================================
log "Creating 2GB swap file for OOM protection..."
if [ -f /swapfile ]; then
  warn "Swap file already exists, skipping"
else
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Tune swappiness - only use swap under memory pressure
  sysctl vm.swappiness=10
  echo 'vm.swappiness=10' >> /etc/sysctl.conf
  log "2GB swap file created (swappiness=10)"
fi

# ============================================================
# 4. Firewall Setup (UFW)
# ============================================================
log "Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
log "Firewall enabled (SSH, HTTP, HTTPS allowed)"

# ============================================================
# 5. Create Application User
# ============================================================
log "Creating application user '$APP_USER'..."
if id "$APP_USER" &>/dev/null; then
  warn "User '$APP_USER' already exists, skipping"
else
  useradd -m -s /bin/bash "$APP_USER"
  log "User '$APP_USER' created"
fi

# ============================================================
# 6. Install Node.js 20 LTS
# ============================================================
log "Installing Node.js 20 LTS..."
if command -v node &>/dev/null; then
  warn "Node.js already installed: $(node -v)"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
  log "Node.js installed: $(node -v)"
fi

# ============================================================
# 7. Install PM2
# ============================================================
log "Installing PM2..."
npm install -g pm2
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER"
log "PM2 installed and configured for startup"

# ============================================================
# 8. Install PostgreSQL 16
# ============================================================
log "Installing PostgreSQL 16..."
if command -v psql &>/dev/null; then
  warn "PostgreSQL already installed: $(psql --version)"
else
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt-get update
  apt-get install -y postgresql-16 postgresql-contrib-16
  systemctl enable postgresql
  systemctl start postgresql
  log "PostgreSQL 16 installed"
fi

# ============================================================
# 9. Setup PostgreSQL Database & User
# ============================================================
log "Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
log "Database '$DB_NAME' and user '$DB_USER' configured"

# ============================================================
# 10. Harden PostgreSQL - WAL Archiving for Point-in-Time Recovery
# ============================================================
log "Configuring PostgreSQL WAL archiving for continuous backup..."
PG_CONF_DIR="/etc/postgresql/16/main"
PG_DATA_DIR="/var/lib/postgresql/16/main"
WAL_ARCHIVE_DIR="/var/backups/morren/wal-archive"

mkdir -p "$WAL_ARCHIVE_DIR"
chown postgres:postgres "$WAL_ARCHIVE_DIR"

# Backup original config
cp "$PG_CONF_DIR/postgresql.conf" "$PG_CONF_DIR/postgresql.conf.backup.$(date +%Y%m%d)"

# WAL archiving settings
cat >> "$PG_CONF_DIR/postgresql.conf" << WAL_EOF

# === Morren Production WAL Settings ===
# WAL archiving for point-in-time recovery
wal_level = replica
archive_mode = on
archive_command = 'test ! -f $WAL_ARCHIVE_DIR/%f && cp %p $WAL_ARCHIVE_DIR/%f'
archive_timeout = 300

# Checkpoint tuning for data safety
checkpoint_timeout = 10min
checkpoint_completion_target = 0.9
max_wal_size = 1GB
min_wal_size = 256MB

# Connection safety
max_connections = 30
shared_buffers = 512MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 128MB

# Logging for debugging
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
WAL_EOF

# Harden pg_hba.conf - only allow local connections with password
cat > "$PG_CONF_DIR/pg_hba.conf" << HBA_EOF
# PostgreSQL Client Authentication Configuration
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             $DB_USER                                md5
host    all             $DB_USER        127.0.0.1/32            md5
host    all             $DB_USER        ::1/128                 md5
# Deny all other connections
local   all             all                                     reject
host    all             all             0.0.0.0/0               reject
HBA_EOF

# Restart PostgreSQL to apply changes
systemctl restart postgresql
log "PostgreSQL WAL archiving enabled (archive_timeout=5min)"
log "WAL archive directory: $WAL_ARCHIVE_DIR"

# ============================================================
# 11. Setup .pgpass for passwordless backup scripts
# ============================================================
log "Setting up .pgpass for backup scripts..."
echo "localhost:5432:$DB_NAME:$DB_USER:$DB_PASSWORD" > /home/$APP_USER/.pgpass
chown "$APP_USER":"$APP_USER" /home/$APP_USER/.pgpass
chmod 600 /home/$APP_USER/.pgpass
log ".pgpass configured"

# ============================================================
# 12. Install Nginx
# ============================================================
log "Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
log "Nginx installed"

# ============================================================
# 13. Install Certbot (Let's Encrypt SSL)
# ============================================================
log "Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx
log "Certbot installed"

# ============================================================
# 14. Setup Application Directories
# ============================================================
log "Setting up application directories..."
mkdir -p "$APP_DIR"
mkdir -p /var/log/morren
mkdir -p /var/backups/morren/full
mkdir -p /var/backups/morren/wal-archive
mkdir -p /var/backups/morren/pre-deploy
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" /var/log/morren
chown -R "$APP_USER":"$APP_USER" /var/backups/morren/full
chown -R "$APP_USER":"$APP_USER" /var/backups/morren/pre-deploy
chown postgres:postgres /var/backups/morren/wal-archive
log "Directories created"

# ============================================================
# 15. Setup Nginx Config
# ============================================================
log "Configuring Nginx..."

if [ "$USE_IP_MODE" = true ]; then
  # ---- IP-ONLY MODE (no SSL, HTTP only) ----
  cat > /etc/nginx/sites-available/morren-api << NGINX_EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;
limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/s;

upstream morren_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_types application/json text/plain application/javascript text/css;
    gzip_min_length 256;

    client_max_body_size 10M;

    proxy_read_timeout 90s;
    proxy_connect_timeout 90s;
    proxy_send_timeout 90s;

    location /auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://morren_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        proxy_pass http://morren_backend/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    location / {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://morren_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF

else
  # ---- DOMAIN MODE (with SSL) ----
  cat > /etc/nginx/sites-available/morren-api << NGINX_EOF
# Rate limiting zones
limit_req_zone \$binary_remote_addr zone=auth:10m rate=5r/s;
limit_req_zone \$binary_remote_addr zone=api:10m rate=30r/s;

upstream morren_backend {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_types application/json text/plain application/javascript text/css;
    gzip_min_length 256;

    client_max_body_size 10M;

    proxy_read_timeout 90s;
    proxy_connect_timeout 90s;
    proxy_send_timeout 90s;

    location /auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://morren_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        proxy_pass http://morren_backend/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    location / {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://morren_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF
fi

ln -sf /etc/nginx/sites-available/morren-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log "Nginx configured for $DOMAIN"

# ============================================================
# 16. Setup SSL Certificate (skip if no domain)
# ============================================================
if [ "$USE_IP_MODE" = true ]; then
  log "Skipping SSL (no domain). Running on HTTP at http://$SERVER_ADDR"
  warn "Add SSL later: 1) Point domain DNS to this IP  2) Run: certbot --nginx -d yourdomain.com"
else
  log "Obtaining SSL certificate..."
  warn "Make sure your domain ($DOMAIN) DNS points to this server's IP before proceeding!"
  read -p "Press Enter when DNS is ready (or Ctrl+C to skip SSL for now)..."
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" --redirect || \
    warn "SSL setup failed. Run manually later: certbot --nginx -d $DOMAIN"
fi

# ============================================================
# 17. Setup s3cmd for DO Spaces Backup
# ============================================================
if [ -n "$SPACES_ACCESS_KEY" ]; then
  log "Configuring s3cmd for DigitalOcean Spaces..."
  read -sp "Enter DigitalOcean Spaces Secret Key: " SPACES_SECRET_KEY
  echo

  apt-get install -y s3cmd

  cat > /home/$APP_USER/.s3cfg << S3_EOF
[default]
access_key = $SPACES_ACCESS_KEY
secret_key = $SPACES_SECRET_KEY
host_base = ${SPACES_REGION}.digitaloceanspaces.com
host_bucket = %(bucket)s.${SPACES_REGION}.digitaloceanspaces.com
use_https = True
S3_EOF

  chown "$APP_USER":"$APP_USER" /home/$APP_USER/.s3cfg
  chmod 600 /home/$APP_USER/.s3cfg

  # Verify Spaces connection
  if sudo -u "$APP_USER" s3cmd ls "s3://$SPACES_BUCKET/" &>/dev/null; then
    log "Spaces connection verified!"
  else
    warn "Cannot connect to Spaces bucket '$SPACES_BUCKET'. Create it in DO console first."
  fi

  log "s3cmd configured for DO Spaces"
else
  warn "Skipping Spaces backup setup. Configure manually later."
fi

# ============================================================
# 18. Setup Log Rotation
# ============================================================
log "Configuring log rotation..."
cat > /etc/logrotate.d/morren << 'LOGROTATE_EOF'
/var/log/morren/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 morren morren
    sharedscripts
    postrotate
        pm2 reloadLogs 2>/dev/null || true
    endscript
}

/var/log/morren/backup.log {
    weekly
    missingok
    rotate 8
    compress
    delaycompress
    notifempty
    create 0640 morren morren
}
LOGROTATE_EOF
log "Log rotation configured (app logs: 14 days, backup logs: 8 weeks)"

# ============================================================
# 19. Setup ALL Cron Jobs
# ============================================================
log "Setting up cron jobs..."
CRON_CONTENT="# Morren Marketplace Cron Jobs
# -----------------------------------------------

# Full database backup every 3 days at 2 AM
0 2 */3 * * /opt/morren/deploy/backup-db.sh >> /var/log/morren/backup.log 2>&1

# WAL archive sync to Spaces every 6 hours
0 */6 * * * /opt/morren/deploy/sync-wal-to-spaces.sh >> /var/log/morren/wal-sync.log 2>&1

# Health monitoring every 5 minutes
*/5 * * * * /opt/morren/deploy/health-monitor.sh >> /var/log/morren/monitor.log 2>&1

# Disk space check daily at 6 AM
0 6 * * * /opt/morren/deploy/disk-check.sh >> /var/log/morren/monitor.log 2>&1

# Verify latest backup integrity weekly (Sunday 3 AM)
0 3 * * 0 /opt/morren/deploy/verify-backup.sh >> /var/log/morren/backup.log 2>&1

# SSL renewal check monthly
0 3 1 * * certbot renew --quiet >> /var/log/morren/certbot.log 2>&1

# Clean old WAL files monthly (keep 7 days)
0 4 1 * * find /var/backups/morren/wal-archive -type f -mtime +7 -delete >> /var/log/morren/backup.log 2>&1
"
echo "$CRON_CONTENT" | crontab -u "$APP_USER" -
log "Cron jobs installed (backup, WAL sync, health monitor, disk check, backup verify)"

# ============================================================
# 20. Setup fail2ban for SSH protection
# ============================================================
log "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'F2B_EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
F2B_EOF

systemctl enable fail2ban
systemctl restart fail2ban
log "fail2ban configured (3 attempts, 2h ban)"

# ============================================================
# 21. Kernel Tuning for Production
# ============================================================
log "Applying kernel tuning..."
cat >> /etc/sysctl.conf << 'SYSCTL_EOF'

# === Morren Production Tuning ===
# Network
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535

# File descriptors
fs.file-max = 65535

# Protect against SYN flood
net.ipv4.tcp_syncookies = 1

# Disable IP source routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
SYSCTL_EOF

sysctl -p
log "Kernel parameters tuned"

# ============================================================
# 22. Set file descriptor limits
# ============================================================
cat >> /etc/security/limits.conf << LIMITS_EOF
$APP_USER soft nofile 65535
$APP_USER hard nofile 65535
LIMITS_EOF

# ============================================================
# 23. Create .env file with auto-generated secrets
# ============================================================
log "Creating environment file..."
JWT_SEC=$(openssl rand -hex 32)
JWT_REF=$(openssl rand -hex 32)
cat > "$APP_DIR/.env" << ENV_EOF
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
JWT_SECRET=$JWT_SEC
JWT_REFRESH_SECRET=$JWT_REF
CORS_ORIGIN=https://your-frontend.vercel.app
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
ENV_EOF

chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
log ".env file created at $APP_DIR/.env (update CORS_ORIGIN and OneSignal keys)"

# ============================================================
# Done!
# ============================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN} Production Server Setup Complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "PROTECTION LAYERS ENABLED:"
echo "  [x] PostgreSQL WAL archiving (continuous point-in-time recovery)"
echo "  [x] Full backup every 3 days + WAL sync every 6 hours to Spaces"
echo "  [x] Pre-deploy backup (automatic before every deployment)"
echo "  [x] Weekly backup integrity verification"
echo "  [x] 2GB swap (OOM protection)"
echo "  [x] fail2ban (SSH brute-force protection)"
echo "  [x] UFW firewall (only 22, 80, 443)"
echo "  [x] Automatic security updates"
echo "  [x] Log rotation (14 days app, 8 weeks backup)"
echo "  [x] Health monitoring every 5 minutes"
echo "  [x] Disk space monitoring daily"
echo "  [x] Kernel hardening + tuning"
echo ""
echo "Next steps:"
echo "  1. Clone your repo:  cd $APP_DIR && git clone <your-repo-url> ."
echo "  2. Edit .env file:   nano $APP_DIR/.env"
echo "     - Set CORS_ORIGIN to your Vercel frontend URL"
echo "     - Add OneSignal keys if using push notifications"
echo "  3. Deploy backend:   bash $APP_DIR/deploy/deploy.sh"
if [ "$USE_IP_MODE" = true ]; then
echo "  4. Test health:      curl http://$SERVER_ADDR/health"
else
echo "  4. Test health:      curl https://$SERVER_ADDR/health"
fi
echo ""
echo "PostgreSQL credentials:"
echo "  Database: $DB_NAME"
echo "  User:     $DB_USER"
echo "  Password: (as entered)"
echo ""
echo "Data safety summary:"
echo "  Worst case (droplet dies): Lose max 6 hours of data (WAL sync interval)"
echo "  With full backup only:     Lose max 3 days of data"
echo "  WAL + full backup:         Recover to any point in last 7 days"
echo ""
echo "Useful commands:"
echo "  pm2 status                          - Check app status"
echo "  pm2 logs morren-backend             - View app logs"
echo "  bash /opt/morren/deploy/deploy.sh   - Deploy update"
echo "  bash /opt/morren/deploy/backup-db.sh - Manual backup"
echo ""
