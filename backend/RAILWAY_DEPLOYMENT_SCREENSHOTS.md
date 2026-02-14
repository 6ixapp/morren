# Railway Deployment - Visual Step-by-Step Guide

This guide shows you exactly what to click in Railway dashboard.

---

## Part 1: Update Environment Variables

### Step 1: Login to Railway

1. Go to: **https://railway.app**
2. Click **"Login"**
3. Enter your credentials

### Step 2: Select Your Project

```
Railway Dashboard
├── Projects List
│   └── 🔍 Find "Morren" or your project name
│       └── 👆 Click on it
```

### Step 3: Open Backend Service

```
Project View
├── Services shown as cards:
│   ├── 🗄️ PostgreSQL (Database)
│   └── 🚀 Backend Service
│       └── 👆 Click on "Backend" card
```

### Step 4: Go to Variables Tab

```
Backend Service View
├── Tabs at top:
│   ├── Deployments
│   ├── Metrics
│   ├── Settings
│   └── Variables  👆 Click here
```

### Step 5: Update JWT Variables

**You'll see a list of variables like:**
```
DATABASE_URL=postgresql://...
PORT=5000
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRES_IN=1h        ← FIND THIS ONE
JWT_REFRESH_EXPIRES_IN=7d  ← FIND THIS ONE
```

**For each variable:**

1. **Find `JWT_EXPIRES_IN`**
   - If it exists: Click the pencil/edit icon ✏️
   - Change value from `1h` to `4h`
   - Click "Save" or press Enter

2. **Find `JWT_REFRESH_EXPIRES_IN`**
   - If it exists: Click the pencil/edit icon ✏️
   - Change value from `7d` to `30d`
   - Click "Save" or press Enter

**If variables don't exist:**
- Click "+ Add Variable" button
- Enter: `JWT_EXPIRES_IN` = `4h`
- Click "+ Add Variable" again
- Enter: `JWT_REFRESH_EXPIRES_IN` = `30d`

### Step 6: Wait for Auto-Redeploy

```
After saving variables:
├── Railway automatically triggers redeploy
├── You'll see a notification: "Deploying..."
├── Wait 2-3 minutes
└── Status changes to "Active" ✅
```

**Watch the deployment:**
- Click on "Deployments" tab
- See latest deployment status
- Wait for "SUCCESS" ✓

---

## Part 2: Deploy Code Changes

### Step 1: Commit Changes Locally

**Open your terminal:**

```bash
# Navigate to backend folder
cd /d/morren/backend

# Check what changed
git status

# You should see:
# modified:   src/index.ts
# modified:   src/controllers/bidController.ts
# new file:   src/controllers/sellerPublicController.ts
# new file:   src/routes/sellerPublicRoutes.ts
# modified:   .env.example

# Add all changes
git add .

# Commit with message
git commit -m "feat: add seller public profiles and extend token lifetime"
```

### Step 2: Push to GitHub/GitLab

```bash
# Push to main branch (Railway watches this branch)
git push origin main
```

**What happens:**
```
Your Computer
    │
    │ git push
    ↓
GitHub/GitLab
    │
    │ webhook trigger
    ↓
Railway
    │
    │ auto-deploy
    ↓
Live Server ✅
```

### Step 3: Watch Deployment in Railway

**In Railway Dashboard:**

1. **Stay on Backend Service page**
2. **Click "Deployments" tab**
3. **You'll see a new deployment appear:**
   ```
   Deployments
   ├── Latest (Building...) ← NEW
   │   └── Status: Building
   │   └── Time: Just now
   ├── Previous (Success) ✓
   │   └── Status: Active
   │   └── Time: 2 hours ago
   ```

4. **Click on the latest deployment to see logs**

### Step 4: Monitor Build Logs

**You'll see logs like:**
```
[build] Installing dependencies...
[build] npm install
[build] Building TypeScript...
[build] npm run build
[build] ✓ Build successful
[deploy] Starting server...
[deploy] 🚀 Server is running on port 5000
[deploy] ✅ Database migrations complete
[deploy] ✓ Deployment successful
```

**If you see errors:**
- Red text = error
- Look for error message
- See "Troubleshooting" section below

### Step 5: Verify Deployment Success

**Check deployment status:**
```
Status should change to:
❌ Building... (wait)
❌ Deploying... (wait)
✅ Success (done!)
```

**Green checkmark = successful deployment!**

---

## Part 3: Test Your Production Server

### Quick Test in Browser

1. **Get your Railway URL:**
   - Railway Dashboard → Backend Service
   - Look for "Domains" section
   - Copy the URL (e.g., `https://morren-backend-production.railway.app`)

2. **Test health endpoint:**
   - Open browser
   - Go to: `https://your-url.railway.app/health`
   - Should see: `{"status":"ok","timestamp":"..."}`

### Test with Thunder Client / Postman

**1. Test Login:**
```
POST https://your-url.railway.app/auth/login
Headers:
  Content-Type: application/json
Body:
{
  "email": "test@example.com",
  "password": "yourpassword"
}
```

**Expected Response:**
```json
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**2. Test Seller Public Profile:**
```
GET https://your-url.railway.app/api/sellers/SELLER_ID/public-profile
Headers:
  Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Expected Response:**
```json
{
  "sellerId": "...",
  "anonymizedId": "SLR-4f2a",
  "publicInfo": {...},
  "recentAcceptedOrders": [...]
}
```

---

## Part 4: Verify in Mobile App

### Update Mobile App API URL (If Needed)

**Check your mobile app's API configuration:**

File: `morera-app/lib/api-config.ts`

```typescript
export const API_CONFIG = {
  baseURL: "https://your-railway-url.railway.app", // ← Should point to Railway
}
```

### Test Mobile App Features

1. **Login Persistence:**
   - Login to app
   - Close app completely
   - Wait 5 minutes
   - Reopen app
   - ✅ Should stay logged in (no login screen)

2. **Seller Profiles:**
   - Go to "My Bids" tab
   - Tap on a bid request
   - Tap "View Offers"
   - ✅ Should see "View Profile" buttons next to each bid
   - Tap "View Profile"
   - ✅ Should see seller stats and recent orders

---

## Visual Flowchart

```
                    DEPLOYMENT FLOW

Step 1: Update Env Vars
    │
    ├──> Railway Dashboard
    │    └──> Backend Service
    │         └──> Variables Tab
    │              ├─ JWT_EXPIRES_IN = 4h
    │              └─ JWT_REFRESH_EXPIRES_IN = 30d
    │
    └──> Auto-redeploy (2-3 min) ✅

Step 2: Deploy Code
    │
    ├──> Local: git commit & push
    │
    ├──> GitHub/GitLab receives code
    │
    ├──> Railway webhook triggered
    │
    ├──> Railway builds & deploys
    │    ├─ Install dependencies
    │    ├─ Build TypeScript
    │    ├─ Start server
    │    └─ Run migrations
    │
    └──> Deployment success ✅

Step 3: Test
    │
    ├──> Browser: /health endpoint
    │
    ├──> API Client: Test endpoints
    │
    └──> Mobile App: Test features ✅
```

---

## Troubleshooting Visual Guide

### Problem: "Can't find Variables tab"

**Solution:**
```
Railway Dashboard
├── Make sure you clicked on Backend SERVICE
│   (Not the PostgreSQL database)
├── Tabs should show:
│   ├── Deployments
│   ├── Metrics
│   ├── Settings
│   └── Variables  ← Here
```

### Problem: "Deployment stuck on Building..."

**Check:**
```
1. Click on deployment
2. Check build logs
3. Look for errors (red text)
4. Common issues:
   ├─ Syntax error in code
   ├─ Missing dependency
   └─ TypeScript errors
```

**Fix:**
```bash
# Test build locally first
npm run build

# If errors, fix and push again
git add .
git commit -m "fix: build errors"
git push origin main
```

### Problem: "New endpoints return 404"

**Check:**
```
1. Verify deployment succeeded
   └─ Railway → Deployments → Should show "Success"

2. Check deployment logs
   └─ Look for: "🚀 Server is running"

3. Verify routes registered
   └─ Search logs for: "/api/sellers"
```

### Problem: "Mobile app still shows old behavior"

**Solutions:**
1. Clear mobile app cache
2. Reinstall mobile app
3. Check API_CONFIG.baseURL points to Railway
4. Verify backend deployment succeeded

---

## Success Indicators

You know deployment succeeded when:

✅ **In Railway Dashboard:**
- Latest deployment shows "Success" with green checkmark
- No errors in logs
- CPU/Memory metrics are stable

✅ **In Browser:**
- `/health` endpoint returns 200 OK
- Response: `{"status":"ok",...}`

✅ **In API Tests:**
- `/api/sellers/:id/public-profile` returns 200 OK
- Bids include `anonymizedSellerId` field

✅ **In Mobile App:**
- Login persistence works
- "View Profile" buttons appear
- Seller profiles load correctly

---

## Time Estimates

```
📊 Deployment Timeline:

00:00 - Start
00:02 - Environment variables updated
00:05 - Railway auto-redeploy complete
00:07 - Code pushed to GitHub
00:12 - Railway build & deploy complete
00:15 - Start testing
00:25 - Testing complete
00:30 - Monitor for issues

✅ Total: ~30 minutes
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────┐
│  RAILWAY DEPLOYMENT QUICK REFERENCE     │
├─────────────────────────────────────────┤
│                                         │
│  1. railway.app → Login                 │
│  2. Select Project                      │
│  3. Backend Service                     │
│  4. Variables Tab                       │
│  5. Update JWT vars                     │
│  6. Wait for redeploy                   │
│  7. git push origin main                │
│  8. Monitor deployment                  │
│  9. Test endpoints                      │
│  10. Verify mobile app                  │
│                                         │
│  Done! ✅                               │
└─────────────────────────────────────────┘
```

---

**Pro Tip:** Bookmark this page for future deployments! 🔖
