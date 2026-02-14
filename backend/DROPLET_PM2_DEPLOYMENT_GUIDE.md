# Safe Deployment Guide - DigitalOcean Droplet + PM2

## ⚠️ CRITICAL: Zero-Downtime Deployment Without Data Loss

This guide ensures you can deploy changes to your production Droplet without losing any database data or causing downtime.

---

## Pre-Deployment Safety Checklist

### ✅ 1. Verify Your Current Setup

**SSH into your Droplet:**
```bash
ssh root@your-droplet-ip
# Or: ssh your-user@your-droplet-ip
```

**Check PM2 status:**
```bash
pm2 status
# Should show your backend process running
```

**Check database connection:**
```bash
# If PostgreSQL is local
sudo -u postgres psql -c "\l"

# If PostgreSQL is remote
psql $DATABASE_URL -c "\l"
```

**Locate your backend directory:**
```bash
# Common locations:
cd /var/www/backend
# Or: cd /home/your-user/backend
# Or: cd ~/backend

pwd  # Print current directory
```

---

## Step 1: BACKUP EVERYTHING (CRITICAL)

### 1a. Backup Database (MOST IMPORTANT)

```bash
# Create backups directory
mkdir -p ~/backups

# Backup PostgreSQL database
# Replace 'morren_db' with your actual database name
pg_dump morren_db > ~/backups/morren_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Or if using DATABASE_URL:
pg_dump $DATABASE_URL > ~/backups/morren_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh ~/backups/
```

**Expected output:**
```
-rw-r--r-- 1 root root 2.3M Feb 14 10:30 morren_db_backup_20260214_103000.sql
```

### 1b. Backup Current Code

```bash
# Navigate to your backend directory
cd /var/www/backend  # Or your actual path

# Create code backup
tar -czf ~/backups/backend_code_$(date +%Y%m%d_%H%M%S).tar.gz .

# Verify backup
ls -lh ~/backups/
```

### 1c. Backup .env File

```bash
# Backup environment variables
cp .env ~/backups/.env.backup_$(date +%Y%m%d_%H%M%S)

# Verify
cat ~/backups/.env.backup_*
```

### 1d. Save PM2 Configuration

```bash
# Save PM2 process list
pm2 save

# Backup PM2 dump file
cp ~/.pm2/dump.pm2 ~/backups/dump.pm2.backup_$(date +%Y%m%d_%H%M%S)
```

---

## Step 2: Update Environment Variables (No Data Loss)

### 2a. Edit .env File

```bash
# Navigate to backend directory
cd /var/www/backend  # Or your actual path

# Backup current .env
cp .env .env.backup

# Edit .env file
nano .env
# Or: vim .env
```

### 2b. Update JWT Settings

**Find these lines:**
```env
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

**Change to:**
```env
# Access Token: Short-lived for security (1-4 hours recommended)
JWT_EXPIRES_IN=4h

# Refresh Token: Long-lived for mobile app persistence (30 days recommended)
JWT_REFRESH_EXPIRES_IN=30d
```

**Save and exit:**
- Nano: `Ctrl+X`, then `Y`, then `Enter`
- Vim: `Esc`, then `:wq`, then `Enter`

### 2c. Verify Changes

```bash
# Check the updated values
grep JWT_ .env

# Should show:
# JWT_EXPIRES_IN=4h
# JWT_REFRESH_EXPIRES_IN=30d
```

---

## Step 3: Deploy Code Changes (Safe Method)

### 3a. Pull Latest Code from Git

**If using Git (Recommended):**

```bash
# Navigate to backend directory
cd /var/www/backend

# Check current git status
git status

# Check current branch
git branch

# Stash any local changes (if any)
git stash

# Pull latest changes from main branch
git pull origin main

# If you get merge conflicts, resolve them or:
# git reset --hard origin/main  # ⚠️ Only if you're sure!
```

**If NOT using Git:**

You'll need to manually upload the new files:
1. Use SCP/SFTP to upload the new files
2. Or copy-paste the changes manually

### 3b. Install Dependencies (If Needed)

```bash
# Check if package.json changed
git diff HEAD@{1} package.json

# If changed, install dependencies
npm install

# Or if using pnpm/yarn:
# pnpm install
# yarn install
```

### 3c. Build TypeScript

```bash
# Clean previous build
rm -rf dist/

# Build TypeScript
npm run build

# Verify build succeeded
ls -la dist/
# Should see compiled JavaScript files
```

---

## Step 4: Restart PM2 Without Data Loss

### 4a. Graceful Restart (Zero Downtime)

```bash
# Option 1: Reload (Zero downtime, graceful restart)
pm2 reload backend

# Or if your app name is different:
pm2 reload all
```

**What this does:**
- ✅ Starts new processes
- ✅ Waits for them to be ready
- ✅ Gracefully shuts down old processes
- ✅ Zero downtime for users
- ✅ Database stays connected

### 4b. Verify Restart

```bash
# Check PM2 status
pm2 status

# Should show:
# ┌────┬────────────┬─────────┬─────────┬─────────┬──────────┐
# │ id │ name       │ mode    │ ↺       │ status  │ cpu      │
# │ 0  │ backend    │ cluster │ 1       │ online  │ 0%       │
# └────┴────────────┴─────────┴─────────┴─────────┴──────────┘
```

### 4c. Check Logs for Errors

```bash
# View real-time logs
pm2 logs backend --lines 50

# Look for:
# ✅ "🚀 Server is running on port 5000"
# ✅ "✅ Database migrations complete"

# If you see errors, check:
pm2 logs backend --err --lines 100
```

---

## Step 5: Verify Deployment

### 5a. Test Health Endpoint

```bash
# From Droplet
curl http://localhost:5000/health

# Or from your local machine
curl http://your-droplet-ip:5000/health

# Expected: {"status":"ok","timestamp":"..."}
```

### 5b. Test Database Connection

```bash
# Check if database is still accessible
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Should return user count
```

### 5c. Test New Endpoints

```bash
# Login to get token
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Copy the accessToken from response

# Test seller public profile
curl -X GET http://localhost:5000/api/sellers/SELLER_ID/public-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Test bid anonymization
curl -X GET http://localhost:5000/api/bids/order/ORDER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5d. Test Mobile App

1. Open mobile app
2. Login (or verify existing session persists)
3. Navigate to "My Bids"
4. Click "View Offers"
5. Verify "View Profile" buttons appear
6. Click "View Profile"
7. Verify seller stats load correctly

---

## Step 6: Monitor for Issues

### 6a. Watch Logs in Real-Time

```bash
# Monitor logs for 10 minutes
pm2 logs backend --lines 100
```

### 6b. Check Memory/CPU Usage

```bash
# Check resource usage
pm2 monit

# Or detailed info
pm2 show backend
```

### 6c. Check Database Connections

```bash
# Check active database connections
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'morren_db';"
```

---

## Rollback Plan (If Something Goes Wrong)

### Quick Rollback (5 minutes)

#### Option 1: Restore Code

```bash
# Stop PM2
pm2 stop backend

# Restore code from backup
cd /var/www/
rm -rf backend
tar -xzf ~/backups/backend_code_TIMESTAMP.tar.gz -C backend/

# Restore .env
cd backend
cp ~/backups/.env.backup_TIMESTAMP .env

# Restart
pm2 restart backend
```

#### Option 2: Revert Git

```bash
# See recent commits
git log --oneline -5

# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard COMMIT_HASH

# Rebuild
npm run build

# Restart
pm2 reload backend
```

#### Option 3: Restore Database (ONLY IF DATABASE IS CORRUPTED)

```bash
# ⚠️ ONLY USE IF DATABASE IS BROKEN!
# This will restore to backup state

# Stop all database connections
pm2 stop backend

# Drop and recreate database
psql -c "DROP DATABASE morren_db;"
psql -c "CREATE DATABASE morren_db;"

# Restore from backup
psql morren_db < ~/backups/morren_db_backup_TIMESTAMP.sql

# Restart backend
pm2 restart backend
```

---

## Common Issues & Solutions

### Issue 1: PM2 Won't Restart

**Error:** `[PM2][ERROR] Process failed to restart`

**Solution:**
```bash
# Kill the process
pm2 delete backend

# Start fresh
pm2 start dist/index.js --name backend

# Save configuration
pm2 save
```

### Issue 2: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solution:**
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 PROCESS_ID

# Restart PM2
pm2 restart backend
```

### Issue 3: Database Connection Failed

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# If not running, start it
sudo systemctl start postgresql

# Restart backend
pm2 restart backend
```

### Issue 4: TypeScript Build Fails

**Error:** `TS2307: Cannot find module`

**Solution:**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Health endpoint returns 200 OK
- [ ] Database is accessible
- [ ] PM2 shows process as "online"
- [ ] No errors in PM2 logs
- [ ] New endpoints return correct data
- [ ] Mobile app works correctly
- [ ] Token persistence works
- [ ] Users can login/logout
- [ ] All existing features still work

---

## PM2 Useful Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs backend

# View only errors
pm2 logs backend --err

# View CPU/Memory usage
pm2 monit

# Restart
pm2 restart backend

# Reload (zero downtime)
pm2 reload backend

# Stop
pm2 stop backend

# Delete
pm2 delete backend

# Save current setup
pm2 save

# Startup script (run on server reboot)
pm2 startup
```

---

## Database Safety Tips

### 1. Automated Daily Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line (backup at 2 AM daily)
0 2 * * * pg_dump morren_db > /root/backups/morren_db_$(date +\%Y\%m\%d).sql

# Save and exit
```

### 2. Keep Last 7 Days of Backups

```bash
# Create cleanup script
cat > ~/cleanup_old_backups.sh << 'EOF'
#!/bin/bash
find ~/backups/ -name "morren_db_*.sql" -mtime +7 -delete
EOF

# Make executable
chmod +x ~/cleanup_old_backups.sh

# Add to crontab (run at 3 AM daily)
crontab -e
# Add: 0 3 * * * /root/cleanup_old_backups.sh
```

---

## Summary of Safe Deployment Process

```
1. Backup database          (5 min)  ✅ Data protected
2. Backup code             (2 min)  ✅ Code protected
3. Update .env             (2 min)  ✅ Config updated
4. Pull latest code        (1 min)  ✅ Code updated
5. Install dependencies    (2 min)  ✅ Deps installed
6. Build TypeScript        (1 min)  ✅ Build complete
7. PM2 reload              (1 min)  ✅ Zero downtime
8. Verify deployment       (10 min) ✅ Everything works
9. Monitor logs            (30 min) ✅ Stable

Total time: ~1 hour
Downtime: 0 seconds ✅
Data loss: None ✅
```

---

## Emergency Contacts

- **Droplet Console:** DigitalOcean dashboard → Droplets → Console
- **Database Backup:** Always in `~/backups/`
- **PM2 Logs:** `pm2 logs backend`
- **System Logs:** `/var/log/syslog`

---

**Ready to deploy safely?** Follow this guide step-by-step and your data will be 100% safe! 🛡️
