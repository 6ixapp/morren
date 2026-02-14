# Quick Droplet Deployment Checklist

**Use this for fast, safe deployment to your DigitalOcean Droplet with PM2**

---

## Pre-Flight Check (2 minutes)

```bash
# SSH into droplet
ssh root@your-droplet-ip

# Check PM2 is running
pm2 status
# Should show: backend - online ✅

# Check database is up
psql $DATABASE_URL -c "\l"
# Should list databases ✅
```

---

## Step 1: BACKUP (5 minutes) ⚠️ CRITICAL

```bash
# Create backups directory
mkdir -p ~/backups

# Backup database (MOST IMPORTANT!)
pg_dump morren_db > ~/backups/db_$(date +%Y%m%d_%H%M%S).sql

# Backup code
cd /var/www/backend  # Or your backend path
tar -czf ~/backups/code_$(date +%Y%m%d_%H%M%S).tar.gz .

# Backup .env
cp .env ~/backups/.env.$(date +%Y%m%d_%H%M%S)

# Verify backups exist
ls -lh ~/backups/
```

**✅ WAIT! Verify you see 3 backup files before continuing!**

---

## Step 2: Update .env (2 minutes)

```bash
# Edit .env
cd /var/www/backend  # Your backend directory
nano .env

# Find and change these lines:
JWT_EXPIRES_IN=1h        → JWT_EXPIRES_IN=4h
JWT_REFRESH_EXPIRES_IN=7d → JWT_REFRESH_EXPIRES_IN=30d

# Save: Ctrl+X, Y, Enter

# Verify changes
grep JWT_ .env
```

---

## Step 3: Deploy Code (5 minutes)

```bash
# Pull latest code
git status
git pull origin main

# If not using git, upload files via SCP/SFTP

# Install dependencies (if package.json changed)
npm install

# Build TypeScript
rm -rf dist/
npm run build

# Verify build succeeded
ls dist/index.js
```

---

## Step 4: Restart PM2 (1 minute)

```bash
# Zero-downtime reload
pm2 reload backend

# Check status
pm2 status
# Should show: online ✅

# Check logs
pm2 logs backend --lines 20
# Should show: "🚀 Server is running" ✅
```

---

## Step 5: Verify (5 minutes)

```bash
# Test health endpoint
curl http://localhost:5000/health
# Should return: {"status":"ok",...} ✅

# Test database is accessible
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
# Should return count ✅

# Login and get token
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'

# Test new seller profile endpoint
curl http://localhost:5000/api/sellers/SELLER_ID/public-profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Step 6: Test Mobile App (5 minutes)

- [ ] Login to mobile app
- [ ] Go to "My Bids" screen
- [ ] Open a bid request
- [ ] Verify "View Profile" buttons appear
- [ ] Click "View Profile"
- [ ] Verify seller stats load

---

## ✅ Success Checklist

- [ ] Backups created (database, code, .env)
- [ ] .env updated with new JWT times
- [ ] Code pulled and built successfully
- [ ] PM2 shows "online" status
- [ ] Health endpoint returns 200
- [ ] Database is accessible
- [ ] New endpoints work
- [ ] Mobile app shows new features
- [ ] No errors in PM2 logs

---

## 🚨 If Something Goes Wrong

### Quick Rollback

```bash
# Stop backend
pm2 stop backend

# Restore code
cd /var/www/
rm -rf backend
tar -xzf ~/backups/code_TIMESTAMP.tar.gz -C backend/

# Restore .env
cd backend
cp ~/backups/.env.TIMESTAMP .env

# Restart
pm2 restart backend

# Check logs
pm2 logs backend
```

### Restore Database (ONLY IF BROKEN!)

```bash
# ⚠️ ONLY use if database is corrupted!
pm2 stop backend
psql -c "DROP DATABASE morren_db;"
psql -c "CREATE DATABASE morren_db;"
psql morren_db < ~/backups/db_TIMESTAMP.sql
pm2 restart backend
```

---

## 📊 Timeline

```
00:00 - SSH into droplet
00:02 - Create backups (CRITICAL!)
00:07 - Update .env file
00:09 - Pull code & build
00:14 - PM2 reload
00:15 - Verify deployment
00:20 - Test mobile app
00:25 - Monitor logs

✅ Done! (25 minutes)
```

---

## 🔧 Useful PM2 Commands

```bash
pm2 list              # Show all processes
pm2 logs backend      # View logs
pm2 logs backend --err # View errors only
pm2 monit             # CPU/Memory monitor
pm2 restart backend   # Restart (brief downtime)
pm2 reload backend    # Reload (zero downtime)
pm2 save              # Save current setup
```

---

## 📞 Emergency Commands

```bash
# Process stuck?
pm2 delete backend
pm2 start dist/index.js --name backend

# Port in use?
sudo lsof -i :5000
sudo kill -9 PROCESS_ID

# PostgreSQL down?
sudo systemctl status postgresql
sudo systemctl start postgresql
```

---

**Print this, follow step-by-step, check boxes as you go!** ✅
