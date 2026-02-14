# Production Deployment Guide - Railway/Live Server

## ⚠️ IMPORTANT: Production Deployment Checklist

Follow these steps carefully to deploy changes to your live production server.

---

## Step 1: Backup Current State (CRITICAL)

Before making any changes:

### 1a. Backup Database
```bash
# If using Railway PostgreSQL
# Go to Railway dashboard → Your Postgres service → Data → Backup

# Or manually backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 1b. Note Current Environment Variables
```bash
# Go to Railway dashboard
# Project → Backend Service → Variables
# Take a screenshot or copy current values
```

### 1c. Tag Current Code Version
```bash
cd /d/morren/backend

# Create a backup tag
git tag -a v1.0-pre-deployment -m "Before seller profiles and token changes"
git push origin v1.0-pre-deployment
```

---

## Step 2: Update Environment Variables in Production

### Option A: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Login to your account

2. **Select Your Project**
   - Click on your Morren project
   - Click on the **Backend service** (not the database)

3. **Update Variables**
   - Click on **"Variables"** tab
   - Find or add these variables:

   **Update These:**
   ```
   JWT_EXPIRES_IN=4h
   JWT_REFRESH_EXPIRES_IN=30d
   ```

4. **Save Changes**
   - Railway will automatically redeploy with new variables
   - Wait for deployment to complete (~2-3 minutes)

5. **Verify Deployment**
   - Check "Deployments" tab
   - Wait for status to show "SUCCESS"
   - Check logs for any errors

### Option B: Railway CLI

```bash
# Install Railway CLI if not installed
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables
railway variables set JWT_EXPIRES_IN=4h
railway variables set JWT_REFRESH_EXPIRES_IN=30d

# Railway will auto-redeploy
```

---

## Step 3: Deploy Code Changes to Production

### 3a. Commit Your Changes

```bash
cd /d/morren/backend

# Check what files changed
git status

# You should see:
# - src/controllers/sellerPublicController.ts (new)
# - src/routes/sellerPublicRoutes.ts (new)
# - src/index.ts (modified)
# - src/controllers/bidController.ts (modified)
# - .env.example (modified)

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: add seller public profiles and extend token lifetime

- Add seller public profile endpoint for buyer transparency
- Add order bidders endpoint for viewing who placed bids
- Add anonymizedSellerId to all bid responses
- Extend refresh token lifetime from 7d to 30d for mobile persistence
- Extend access token lifetime from 1h to 4h
- All changes are backward compatible"
```

### 3b. Push to Production

```bash
# Push to main branch (Railway auto-deploys from main)
git push origin main
```

### 3c. Monitor Deployment

1. **Go to Railway Dashboard**
   - Click on Backend service
   - Click on "Deployments" tab

2. **Watch the deployment logs**
   - Look for:
     ```
     🚀 Server is running on port 5000
     ✅ Database migrations complete
     ```

3. **Check for errors**
   - If you see errors, check "What to Do If Deployment Fails" section below

---

## Step 4: Verify Production Deployment

### 4a. Test Health Endpoint

```bash
# Replace with your actual Railway URL
PROD_URL="https://your-backend.railway.app"

curl $PROD_URL/health
# Expected: {"status":"ok","timestamp":"2026-02-14T..."}
```

### 4b. Test New Endpoints

```bash
# 1. Login to get a token
curl -X POST $PROD_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com","password":"your-password"}'

# Copy the accessToken from response

# 2. Test seller public profile
curl -X GET $PROD_URL/api/sellers/SELLER_ID/public-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with seller profile

# 3. Test that bids include anonymizedSellerId
curl -X GET $PROD_URL/api/bids/order/ORDER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: Bids array with "anonymizedSellerId" field
```

### 4c. Test Mobile App

1. **Test Login Persistence:**
   - Login to mobile app
   - Close app completely
   - Wait 1 hour
   - Reopen app
   - ✅ Should still be logged in

2. **Test Seller Profiles:**
   - Go to "My Bids" screen
   - Open a bid request
   - Click "View Offers"
   - ✅ Should see "View Profile" buttons
   - Click "View Profile"
   - ✅ Should see seller stats and recent orders

---

## Step 5: Monitor Production After Deployment

### 5a. Check Railway Logs

```bash
# Using Railway CLI
railway logs

# Or in Railway Dashboard
# Go to Backend service → Click on latest deployment → View logs
```

### 5b. Look for These Success Messages

```
🚀 Server is running on port 5000
📍 Environment: production
✅ Database migrations complete
```

### 5c. Monitor for Errors

Watch for any errors in the first 30 minutes after deployment:
- API errors
- Database connection issues
- Authentication failures

---

## What to Do If Deployment Fails

### Scenario 1: Railway Build Fails

**Error:** TypeScript compilation errors

**Solution:**
```bash
# Test build locally first
npm run build

# If errors, fix them
# Then commit and push again
git add .
git commit -m "fix: resolve build errors"
git push origin main
```

### Scenario 2: Server Crashes on Startup

**Error:** Server won't start, immediate crash

**Solution:**
1. Check Railway logs for specific error
2. Common issues:
   - Missing environment variables
   - Database connection failed
   - Port already in use

**Quick Fix:**
```bash
# Rollback to previous version
git revert HEAD
git push origin main

# Railway will auto-deploy previous version
```

### Scenario 3: New Endpoints Return 404

**Error:** `/api/sellers/:id/public-profile` returns 404

**Solution:**
1. Check that files were deployed:
   - Railway Dashboard → Deployments → View logs
   - Look for "Deployment successful"

2. Verify routes are registered:
   - Check logs for route registration messages

3. Restart the service:
   - Railway Dashboard → Backend service → Settings → Restart

### Scenario 4: Environment Variables Not Applied

**Error:** Token still expires after 1 hour

**Solution:**
1. Verify variables in Railway Dashboard
2. Redeploy manually:
   - Railway Dashboard → Backend service → Deployments → "Redeploy"

---

## Emergency Rollback Plan

If something goes seriously wrong:

### Option 1: Rollback to Previous Git Version

```bash
# Find the previous working commit
git log --oneline

# Revert to it
git revert HEAD
git push origin main

# Or use the backup tag
git checkout v1.0-pre-deployment
git push origin main --force
```

### Option 2: Revert Environment Variables

```bash
# In Railway Dashboard → Variables
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Click "Save"
# Railway will redeploy
```

### Option 3: Use Railway Rollback Feature

1. Go to Railway Dashboard
2. Backend service → Deployments
3. Find the last working deployment
4. Click three dots (...) → "Redeploy"

---

## Post-Deployment Checklist

After successful deployment, verify:

- [ ] Health endpoint responds correctly
- [ ] Users can login
- [ ] New seller profile endpoint works
- [ ] Bids include anonymizedSellerId
- [ ] Mobile app can view seller profiles
- [ ] No errors in Railway logs
- [ ] Token persistence works (test after a few hours)
- [ ] Database is still accessible
- [ ] All existing features still work

---

## Database Migration (If Needed in Future)

For the optional rating system enhancement:

```bash
# Create migration file
# backend/src/db/migrations/002_add_bid_ratings.sql

ALTER TABLE bids ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE bids ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE bids ADD COLUMN IF NOT EXISTS days_delayed INTEGER DEFAULT 0;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_bids_rating ON bids(rating);
```

Then:
```bash
# Commit and push
git add src/db/migrations/002_add_bid_ratings.sql
git commit -m "feat: add rating fields to bids table"
git push origin main

# Railway will auto-run migrations on deploy
```

---

## Monitoring Tools

### Railway Dashboard Metrics

1. **CPU Usage**
   - Backend service → Metrics → CPU
   - Should stay below 80%

2. **Memory Usage**
   - Backend service → Metrics → Memory
   - Should stay below 512MB

3. **Request Volume**
   - Backend service → Metrics → Network
   - Watch for unusual spikes

### Log Monitoring

```bash
# Real-time logs
railway logs --follow

# Search for errors
railway logs | grep -i error

# Search for specific endpoint
railway logs | grep "GET /api/sellers"
```

---

## Troubleshooting Common Issues

### Issue: "Token refresh still fails after update"

**Cause:** Environment variables not applied

**Fix:**
```bash
# Verify variables
railway variables

# Should show:
# JWT_EXPIRES_IN=4h
# JWT_REFRESH_EXPIRES_IN=30d

# If not, set them again
railway variables set JWT_REFRESH_EXPIRES_IN=30d

# Force redeploy
railway up --detach
```

### Issue: "Seller profile returns 500 error"

**Cause:** Database query issue or missing seller

**Fix:**
1. Check Railway logs for specific error
2. Verify seller exists in database:
   ```sql
   SELECT id, role FROM users WHERE role = 'seller' LIMIT 5;
   ```
3. Test with a valid seller ID

### Issue: "Mobile app shows error after update"

**Cause:** API endpoint mismatch

**Fix:**
1. Clear mobile app cache
2. Verify API_BASE_URL in mobile app points to Railway URL
3. Check mobile app console logs
4. Test endpoints with curl to confirm they work

---

## Best Practices for Future Deployments

1. **Always deploy during low-traffic hours**
   - Evenings or weekends
   - Avoid peak business hours

2. **Test in staging first** (if you have staging)
   - Deploy to staging
   - Run full test suite
   - Then deploy to production

3. **Deploy in small batches**
   - Don't deploy 10 features at once
   - Deploy 1-2 features, verify, then continue

4. **Monitor for 24 hours after deployment**
   - Check logs regularly
   - Watch for error spikes
   - Monitor user feedback

5. **Have a rollback plan ready**
   - Know how to revert quickly
   - Keep previous version tagged
   - Document rollback steps

---

## Getting Help

If you encounter issues during deployment:

1. **Check Railway Status**
   - https://status.railway.app
   - Ensure no platform-wide issues

2. **Review Logs**
   - Railway Dashboard → Logs
   - Look for specific error messages

3. **Railway Support**
   - Discord: https://discord.gg/railway
   - Email: team@railway.app

4. **Share Error Details**
   - Full error message
   - Relevant logs
   - Steps to reproduce

---

## Summary of Deployment Steps

```bash
# 1. Backup
git tag -a v1.0-backup -m "Pre-deployment backup"
git push origin v1.0-backup

# 2. Update Railway environment variables
# (Do this in Railway Dashboard)
JWT_EXPIRES_IN=4h
JWT_REFRESH_EXPIRES_IN=30d

# 3. Deploy code
git add .
git commit -m "feat: seller profiles and token lifetime"
git push origin main

# 4. Monitor deployment
railway logs --follow

# 5. Test
curl https://your-backend.railway.app/health
curl https://your-backend.railway.app/api/sellers/ID/public-profile

# 6. Verify mobile app works

# Done! 🎉
```

---

## Timeline

- **Preparation:** 10 minutes (backup, verify)
- **Environment variables update:** 2 minutes
- **Code deployment:** 5 minutes (Railway auto-deploy)
- **Testing:** 10 minutes
- **Monitoring:** 30 minutes (initial watch)

**Total:** ~1 hour for safe production deployment

---

**Ready to deploy?** Follow the steps above carefully, and you'll have a smooth production deployment! 🚀
