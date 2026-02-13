# Vercel Deployment Guide - Frontend

Complete guide to deploy your Next.js frontend to Vercel with production API integration.

---

## 🎯 Prerequisites

- ✅ Backend deployed to DigitalOcean: `https://api.zentrip.social`
- ✅ GitHub repository with your code
- ✅ Vercel account (free): https://vercel.com

---

## 🚀 Step 1: Push Code to GitHub

### 1.1 Commit All Changes

```bash
# Add all files
git add .

# Commit
git commit -m "feat: Update API configuration for production deployment

- Configure CORS for Vercel domains
- Update API client to use production URL
- Add Vercel configuration
- Update environment variables

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push origin main
```

### 1.2 Verify on GitHub

1. Go to your GitHub repository
2. Verify all files are pushed
3. Check that `.env.local` is NOT pushed (should be in `.gitignore`)

---

## 🚀 Step 2: Deploy Backend Changes

SSH into your droplet and update the backend:

```bash
# SSH into droplet
ssh root@api.zentrip.social

# Navigate to project
cd /opt/morren

# Pull latest changes
git pull origin main

# Rebuild backend with new CORS config
cd backend
npm run build

# Restart backend
pm2 restart morren-backend

# Check logs
pm2 logs morren-backend --lines 20
```

**Expected:** Backend should start without errors

---

## 🚀 Step 3: Deploy Frontend to Vercel

### 3.1 Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your GitHub account
5. Find and select your `morren` repository
6. Click **"Import"**

### 3.2 Configure Project

**Framework Preset:** Next.js (auto-detected)

**Root Directory:** `.` (leave as root)

**Build Command:** `npm run build` (auto-filled)

**Output Directory:** `.next` (auto-filled)

**Install Command:** `npm install` (auto-filled)

### 3.3 Set Environment Variables

Click **"Environment Variables"** section and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.zentrip.social` |

**Important:** Make sure to select **"Production"** environment

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait ~2-3 minutes for build to complete
3. You'll get a URL like: `https://morren-xxx.vercel.app`

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Frontend

1. Visit your Vercel URL: `https://morren-xxx.vercel.app`
2. Check that the page loads
3. Open browser DevTools → Console
4. Look for any errors

### 4.2 Test API Integration

#### Test Registration

1. Go to Sign Up page
2. Create a new account:
   - Email: `test@example.com`
   - Password: `Test1234`
   - Name: `Test User`
   - Role: `buyer`
3. Click **"Sign Up"**

**Expected:** Successfully creates account and redirects to dashboard

#### Test Login

1. Go to Login page
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `Test1234`
3. Click **"Login"**

**Expected:** Successfully logs in and redirects to dashboard

#### Check Browser Console

Open DevTools → Network tab:
- All API requests should go to `https://api.zentrip.social`
- Responses should be `200 OK` (not CORS errors)

---

## 🔧 Step 5: Update Backend CORS (If Needed)

If you see CORS errors in browser console, update backend CORS:

```bash
# SSH into droplet
ssh root@api.zentrip.social

# Edit backend index.ts
nano /opt/morren/backend/src/index.ts

# Find the CORS section and add your Vercel domain
# Example: 'https://morren-xxx.vercel.app'
```

Update the production origins array:
```typescript
origin: process.env.NODE_ENV === 'production'
  ? [
      'https://zentrip.social',
      'https://www.zentrip.social',
      'https://morren-xxx.vercel.app',  // Add your actual Vercel URL here
      /^https:\/\/.*\.vercel\.app$/,     // This already allows ALL Vercel apps
      'http://localhost:3000',
    ]
```

Then rebuild and restart:
```bash
cd /opt/morren/backend
npm run build
pm2 restart morren-backend
```

---

## 🌐 Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain to Vercel

1. Go to your Vercel project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add Domain"**
4. Enter your domain: `app.zentrip.social` or `zentrip.social`
5. Click **"Add"**

### 6.2 Update DNS

Vercel will show you DNS records to add:

**For subdomain (app.zentrip.social):**
- Type: `CNAME`
- Name: `app`
- Value: `cname.vercel-dns.com`

**For root domain (zentrip.social):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21`

Add these in your domain registrar (Namecheap, GoDaddy, etc.)

### 6.3 Wait for Verification

- DNS propagation: 5-60 minutes
- Vercel will auto-issue SSL certificate
- Your app will be accessible at your custom domain

---

## 🔍 Troubleshooting

### Issue 1: CORS Error in Browser

**Symptom:** Console shows: `Access to fetch at 'https://api.zentrip.social' has been blocked by CORS policy`

**Solution:**
1. Check backend CORS configuration includes your Vercel domain
2. The regex `/^https:\/\/.*\.vercel\.app$/` should allow all Vercel apps
3. Verify backend restarted: `pm2 logs morren-backend`

### Issue 2: API Requests Go to Wrong URL

**Symptom:** Network tab shows requests to `http://localhost:5000`

**Solution:**
1. Check Vercel environment variable `NEXT_PUBLIC_API_URL` is set
2. Rebuild: Go to Vercel → Deployments → Click ⋯ → Redeploy
3. Clear browser cache

### Issue 3: 404 on API Endpoints

**Symptom:** API returns 404 Not Found

**Solution:**
1. Verify endpoint paths match backend routes
2. Check API is accessible: `curl https://api.zentrip.social/health`
3. Review backend logs: `pm2 logs morren-backend`

### Issue 4: Build Fails on Vercel

**Symptom:** Build fails with TypeScript or dependency errors

**Solution:**
1. Check Vercel build logs for specific error
2. Ensure all dependencies are in `package.json`
3. Test build locally: `npm run build`
4. If successful locally, try redeploying

### Issue 5: Environment Variables Not Working

**Symptom:** `process.env.NEXT_PUBLIC_API_URL` is undefined

**Solution:**
1. Environment variables MUST start with `NEXT_PUBLIC_` to be exposed to browser
2. Redeploy after adding environment variables
3. Check: Vercel → Settings → Environment Variables

---

## 📊 Vercel Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend updated with new CORS config
- [ ] Backend restarted and working
- [ ] Vercel project created
- [ ] Environment variable `NEXT_PUBLIC_API_URL` added
- [ ] Deployment successful
- [ ] Frontend loads at Vercel URL
- [ ] Registration works
- [ ] Login works
- [ ] No CORS errors in console
- [ ] API requests go to production URL
- [ ] (Optional) Custom domain configured

---

## 🔐 Environment Variables Reference

### Required for Vercel

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://api.zentrip.social` | Production |

### Optional

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_GA_ID` | Your Google Analytics ID | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | Your Sentry DSN | Production |

---

## 📝 Post-Deployment Tasks

### Update Backend CORS with Final Domain

Once you know your Vercel URL:

```bash
ssh root@api.zentrip.social
nano /opt/morren/backend/src/index.ts

# Add your Vercel URL to the CORS origins array
# Example: 'https://morren-abc123.vercel.app'

cd /opt/morren/backend
npm run build
pm2 restart morren-backend
```

### Test All Functionality

- [ ] User registration
- [ ] User login
- [ ] Create items (as seller)
- [ ] Browse items
- [ ] Create orders (as buyer)
- [ ] Submit bids (as seller)
- [ ] View dashboard stats

### Setup Monitoring

1. **Vercel Analytics** (Built-in)
   - Automatically enabled
   - View in Vercel dashboard

2. **Backend Monitoring**
   - UptimeRobot: Monitor `https://api.zentrip.social/health`
   - Set up email alerts for downtime

3. **Error Tracking** (Optional)
   - Sentry for frontend errors
   - Backend logging with PM2

---

## 🎯 Production URLs

After deployment, your app will be accessible at:

**Frontend:**
- Vercel URL: `https://morren-xxx.vercel.app`
- Custom domain (optional): `https://app.zentrip.social`

**Backend API:**
- Production: `https://api.zentrip.social`
- Health check: `https://api.zentrip.social/health`

---

## 📞 Quick Commands

```bash
# Redeploy frontend (from local)
git add .
git commit -m "Update"
git push origin main
# Vercel auto-deploys on push

# Update backend
ssh root@api.zentrip.social
cd /opt/morren
git pull origin main
cd backend
npm run build
pm2 restart morren-backend

# Check backend logs
ssh root@api.zentrip.social
pm2 logs morren-backend --lines 50

# Test API
curl https://api.zentrip.social/health
```

---

## 🎉 Success!

Your frontend is now deployed to Vercel and connected to your production API!

**Next Steps:**
1. Test all features thoroughly
2. Setup custom domain (optional)
3. Configure monitoring
4. Share with users! 🚀

---

**Your app is live and ready for production use!**
