# Quick Production Deployment Checklist

Use this checklist for deploying the seller profile and token changes to production.

---

## Pre-Deployment (5 minutes)

- [ ] Backup current code version
  ```bash
  git tag -a v1.0-backup -m "Before seller profiles"
  git push origin v1.0-backup
  ```

- [ ] Take screenshot of Railway environment variables

- [ ] Note current server uptime and status

---

## Deployment (10 minutes)

### Step 1: Update Environment Variables

- [ ] Login to Railway dashboard: https://railway.app
- [ ] Click on your project → Backend service
- [ ] Go to "Variables" tab
- [ ] Add/Update these variables:
  ```
  JWT_EXPIRES_IN=4h
  JWT_REFRESH_EXPIRES_IN=30d
  ```
- [ ] Click "Save" or "Add Variable"
- [ ] Wait for auto-redeploy to complete (2-3 min)

### Step 2: Deploy Code Changes

- [ ] Commit changes:
  ```bash
  cd /d/morren/backend
  git add .
  git commit -m "feat: seller profiles and extended token lifetime"
  ```

- [ ] Push to production:
  ```bash
  git push origin main
  ```

- [ ] Watch deployment in Railway dashboard
- [ ] Wait for "SUCCESS" status

---

## Verification (10 minutes)

### Step 3: Test Endpoints

- [ ] Test health check:
  ```bash
  curl https://YOUR-BACKEND.railway.app/health
  ```
  Expected: `{"status":"ok","timestamp":"..."}`

- [ ] Test login (to get token):
  ```bash
  curl -X POST https://YOUR-BACKEND.railway.app/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}'
  ```

- [ ] Test new seller profile endpoint:
  ```bash
  curl -X GET https://YOUR-BACKEND.railway.app/api/sellers/SELLER_ID/public-profile \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  Expected: 200 OK with seller data

- [ ] Test bid anonymization:
  ```bash
  curl -X GET https://YOUR-BACKEND.railway.app/api/bids/order/ORDER_ID \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```
  Expected: Bids include "anonymizedSellerId" field

### Step 4: Test Mobile App

- [ ] Login to mobile app
- [ ] Navigate to "My Bids" screen
- [ ] Open a bid request
- [ ] Verify "View Profile" buttons appear
- [ ] Click "View Profile" on a bid
- [ ] Verify seller stats and recent orders display

### Step 5: Test Token Persistence

- [ ] Login to mobile app
- [ ] Note the time
- [ ] Close app completely
- [ ] Wait 1-2 hours
- [ ] Reopen app
- [ ] Verify automatic login (no login screen)

---

## Monitoring (30 minutes)

- [ ] Check Railway logs for errors:
  ```bash
  railway logs
  ```

- [ ] Monitor CPU/Memory in Railway dashboard

- [ ] Watch for these success logs:
  ```
  🚀 Server is running on port 5000
  📍 Environment: production
  ✅ Database migrations complete
  ```

- [ ] Check for error patterns:
  ```bash
  railway logs | grep -i error
  ```

- [ ] Verify no spike in failed requests

---

## Rollback Plan (If Needed)

If something goes wrong:

### Quick Rollback (2 minutes)

- [ ] Railway Dashboard → Backend service → Deployments
- [ ] Find last working deployment
- [ ] Click (...) menu → "Redeploy"

### Full Rollback (5 minutes)

- [ ] Revert code:
  ```bash
  git revert HEAD
  git push origin main
  ```

- [ ] Revert environment variables:
  ```
  JWT_EXPIRES_IN=1h
  JWT_REFRESH_EXPIRES_IN=7d
  ```

- [ ] Wait for Railway redeploy

---

## Success Criteria

✅ All checks must pass:

- [ ] Health endpoint returns 200 OK
- [ ] Login works correctly
- [ ] New endpoints return valid data (not 404/500)
- [ ] Existing endpoints still work
- [ ] Mobile app can view seller profiles
- [ ] Token persistence works
- [ ] No critical errors in logs
- [ ] CPU/Memory usage normal

---

## Post-Deployment

- [ ] Notify team deployment is complete
- [ ] Monitor logs for next 24 hours
- [ ] Update documentation with production URLs
- [ ] Mark deployment as successful in project tracker

---

## Timeline

```
09:00 - Start deployment
09:05 - Update environment variables
09:08 - Push code changes
09:13 - Deployment complete
09:15 - Start testing
09:25 - Testing complete
09:30 - Monitor for issues
10:00 - Deployment successful ✅
```

**Total Time:** ~1 hour

---

## Quick Reference

### Railway URLs
- Dashboard: https://railway.app
- Your Backend: https://YOUR-PROJECT.railway.app
- Logs: Railway Dashboard → Service → Deployments → Logs

### Important Commands
```bash
# View logs
railway logs

# Check status
railway status

# Redeploy
railway up --detach

# View variables
railway variables
```

---

## Need Help?

**Railway Dashboard Not Loading?**
→ Check https://status.railway.app

**Deployment Failed?**
→ Check logs: `railway logs`

**Mobile App Not Working?**
→ Check API_BASE_URL points to Railway

**Rollback Needed?**
→ See "Rollback Plan" section above

---

Print this checklist and check off items as you go! ✅
