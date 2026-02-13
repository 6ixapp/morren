# Production API Troubleshooting - api.zentrip.social

## Current Status

**Tested:** February 13, 2026

### ✅ Working:
- Health endpoint: `https://api.zentrip.social/health` (200 OK)
- HTTPS/SSL certificate configured
- Nginx reverse proxy working
- Server running on droplet

### ❌ Not Working:
- `/auth/register` → 500 Internal Server Error
- `/auth/login` → 500 Internal Server Error
- **Root cause:** Database connection failure

---

## 🔍 Quick Diagnosis Commands

SSH into your droplet and run these:

### 1. Check Backend Logs
```bash
ssh root@api.zentrip.social
# or
ssh root@139.59.67.227

# Check PM2 logs (look for database errors)
pm2 logs morren-backend --lines 100 --err
```

**Look for errors like:**
- `Error: connect ECONNREFUSED`
- `password authentication failed`
- `database "morren_db" does not exist`
- `DATABASE_URL is not set`

### 2. Check PostgreSQL Status
```bash
systemctl status postgresql
```

**Expected:** `active (running)`

If not running:
```bash
systemctl start postgresql
systemctl enable postgresql
```

### 3. Check Database Exists
```bash
sudo -u postgres psql -l | grep morren_db
```

**Expected:** Should see `morren_db` in the list

If missing:
```bash
sudo -u postgres psql
CREATE DATABASE morren_db;
CREATE USER morren_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE morren_db TO morren_user;
\q
```

### 4. Check Backend Environment Variables
```bash
cat /opt/morren/backend/.env
```

**Required variables:**
```bash
DATABASE_URL=postgresql://morren_user:YOUR_PASSWORD@localhost:5432/morren_db
JWT_SECRET=<long random string>
JWT_REFRESH_SECRET=<another long random string>
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
```

**Common issues:**
- `DATABASE_URL` is missing or incorrect
- Password in `DATABASE_URL` doesn't match PostgreSQL password
- Wrong database name or user

### 5. Test Database Connection
```bash
# Test connection using credentials from .env
sudo -u postgres psql -d morren_db -c "SELECT 1;"
```

**Expected:** Should return `1`

### 6. Check Migrations Have Run
```bash
sudo -u postgres psql -d morren_db
\dt
```

**Expected:** Should see tables like:
- `users`
- `items`
- `orders`
- `bids`
- etc.

If no tables:
```bash
cd /opt/morren/backend
npm run migrate
```

---

## 🛠️ Step-by-Step Fix

### Step 1: Check and Fix DATABASE_URL

```bash
# View current .env
cat /opt/morren/backend/.env | grep DATABASE_URL

# If missing or incorrect, edit it
nano /opt/morren/backend/.env
```

**Correct format:**
```bash
DATABASE_URL=postgresql://morren_user:YOUR_ACTUAL_PASSWORD@localhost:5432/morren_db
```

**Replace:**
- `morren_user` - your PostgreSQL username
- `YOUR_ACTUAL_PASSWORD` - your PostgreSQL password
- `morren_db` - your database name

Save: `Ctrl+X` → `Y` → `Enter`

### Step 2: Verify Database Credentials

```bash
# Extract connection details from .env
grep DATABASE_URL /opt/morren/backend/.env

# Test connection manually
# If DATABASE_URL is: postgresql://morren_user:MyPass123@localhost:5432/morren_db
sudo -u postgres psql -d morren_db -U morren_user -W
# Enter password when prompted

# If this fails, reset PostgreSQL password:
sudo -u postgres psql
ALTER USER morren_user WITH PASSWORD 'NewPassword123!';
\q

# Update .env with new password
nano /opt/morren/backend/.env
```

### Step 3: Run Database Migrations

```bash
cd /opt/morren/backend

# Check if migrations exist
ls -l src/db/

# Run migrations
npm run migrate

# Or manually:
node dist/db/migrate.js
```

**Expected output:**
```
Running migrations...
✅ Migration 001-create-users-table.sql completed
✅ Migration 002-create-items-table.sql completed
...
✅ Database migrations complete
```

### Step 4: Restart Backend

```bash
pm2 restart morren-backend

# Check status
pm2 status

# Monitor logs
pm2 logs morren-backend --lines 50
```

**Look for:**
```
✅ Server is running on port 5000
✅ Database migrations complete
```

### Step 5: Test API Again

```bash
# Test health
curl https://api.zentrip.social/health

# Test register
curl -X POST https://api.zentrip.social/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "buyer"
  }'
```

**Expected:** Should return user object and tokens, not "Internal server error"

---

## 📋 Common Issues & Solutions

### Issue 1: "password authentication failed for user morren_user"

**Fix:**
```bash
sudo -u postgres psql
ALTER USER morren_user WITH PASSWORD 'YourNewPassword';
\q

# Update .env
nano /opt/morren/backend/.env
# Update DATABASE_URL with new password

pm2 restart morren-backend
```

### Issue 2: "database morren_db does not exist"

**Fix:**
```bash
sudo -u postgres psql
CREATE DATABASE morren_db OWNER morren_user;
\q

cd /opt/morren/backend
npm run migrate

pm2 restart morren-backend
```

### Issue 3: "relation users does not exist"

**Fix:** Migrations haven't run
```bash
cd /opt/morren/backend
npm run migrate
pm2 restart morren-backend
```

### Issue 4: Backend logs show "DATABASE_URL is not set"

**Fix:**
```bash
# Check if .env exists
ls -la /opt/morren/backend/.env

# If missing, create it
nano /opt/morren/backend/.env
```

Add:
```bash
DATABASE_URL=postgresql://morren_user:YOUR_PASSWORD@localhost:5432/morren_db
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
PORT=5000
NODE_ENV=production
CORS_ORIGIN=*
```

Save and restart:
```bash
pm2 restart morren-backend
```

### Issue 5: "connect ECONNREFUSED 127.0.0.1:5432"

**Fix:** PostgreSQL is not running
```bash
systemctl status postgresql
systemctl start postgresql
systemctl enable postgresql

# Verify it's running
systemctl status postgresql
```

---

## 🔄 Complete Reset (If All Else Fails)

### Nuclear Option: Recreate Database

```bash
# Stop backend
pm2 stop morren-backend

# Backup existing data (if any)
sudo -u postgres pg_dump morren_db > /tmp/morren_backup_$(date +%Y%m%d).sql

# Drop and recreate database
sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS morren_db;
DROP USER IF EXISTS morren_user;
CREATE USER morren_user WITH PASSWORD 'YourNewStrongPassword123!';
CREATE DATABASE morren_db OWNER morren_user;
GRANT ALL PRIVILEGES ON DATABASE morren_db TO morren_user;
EOF

# Update .env with new password
nano /opt/morren/backend/.env
# Update DATABASE_URL

# Run migrations
cd /opt/morren/backend
npm run migrate

# Restart backend
pm2 restart morren-backend

# Check logs
pm2 logs morren-backend
```

---

## ✅ Verification Checklist

After fixing, verify these work:

```bash
# 1. Health check
curl https://api.zentrip.social/health
# Expected: {"status":"ok","timestamp":"..."}

# 2. Register new user
curl -X POST https://api.zentrip.social/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test","role":"buyer"}'
# Expected: User object with tokens

# 3. Login
curl -X POST https://api.zentrip.social/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
# Expected: User object with tokens

# 4. Get items (should work even without auth)
curl https://api.zentrip.social/api/items
# Expected: Empty array [] or list of items

# 5. Check backend logs have no errors
pm2 logs morren-backend --lines 50
```

---

## 📊 API Endpoint Reference

Your API base URL: `https://api.zentrip.social`

### Public Endpoints (No Auth Required)
- `GET /health` - Health check
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /api/items` - List items (public items only)

### Protected Endpoints (Require Auth Token)
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout
- `GET /api/users` - List users (admin)
- `POST /api/items` - Create item
- `GET /api/orders` - List orders
- `POST /api/bids` - Create bid
- etc.

### Auth Token Usage
```bash
# 1. Login to get token
TOKEN=$(curl -X POST https://api.zentrip.social/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' | jq -r '.accessToken')

# 2. Use token in requests
curl https://api.zentrip.social/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔐 Security Notes

### Current CORS Settings

Your backend currently allows these origins (from code review):
```javascript
cors({
  origin: [
    'http://localhost:3000',
    'http://10.34.242.101:3000',
    /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  ],
  credentials: true,
})
```

**⚠️ This does NOT include your production domain!**

### Fix CORS for Production

```bash
nano /opt/morren/backend/src/index.ts
```

Update CORS config:
```javascript
cors({
  origin: [
    'https://zentrip.social',
    'https://www.zentrip.social',
    'https://app.zentrip.social',
    'http://localhost:3000', // For local development
  ],
  credentials: true,
})
```

Or temporarily allow all:
```javascript
cors({
  origin: '*',
  credentials: true,
})
```

After editing:
```bash
cd /opt/morren/backend
npm run build
pm2 restart morren-backend
```

---

## 📞 Quick Commands Summary

```bash
# SSH into server
ssh root@139.59.67.227

# Check backend logs
pm2 logs morren-backend --lines 100 --err

# Check database
systemctl status postgresql
sudo -u postgres psql -d morren_db -c "\dt"

# Check .env
cat /opt/morren/backend/.env

# Test database connection
sudo -u postgres psql -d morren_db -c "SELECT 1;"

# Run migrations
cd /opt/morren/backend && npm run migrate

# Restart backend
pm2 restart morren-backend

# Test API
curl https://api.zentrip.social/health
curl -X POST https://api.zentrip.social/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","name":"Test","role":"buyer"}'
```

---

## 🆘 Still Not Working?

1. **Check PM2 logs in detail:**
   ```bash
   pm2 logs morren-backend --lines 200
   ```

2. **Check PostgreSQL logs:**
   ```bash
   tail -100 /var/log/postgresql/postgresql-16-main.log
   ```

3. **Check Nginx logs:**
   ```bash
   tail -100 /var/log/nginx/error.log
   ```

4. **Verify environment:**
   ```bash
   pm2 env morren-backend
   ```

5. **Manual test backend locally:**
   ```bash
   curl http://localhost:5000/health
   curl -X POST http://localhost:5000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test123!","name":"Test","role":"buyer"}'
   ```

---

**After fixing, your API should work perfectly! 🎉**

Update your frontend to use: `https://api.zentrip.social`
