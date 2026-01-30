# 🚂 Railway Deployment Guide

## Your Deployed URLs
- **Backend API:** `https://morren-production.up.railway.app`
- **Database:** Railway PostgreSQL (internal)

---

## Quick Deploy Steps

### Step 1: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. **Set Root Directory:** `backend`

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Wait for database to provision (~30 seconds)
3. Railway automatically links `DATABASE_URL`

### Step 3: Link Database to Backend

1. Click on your **backend service**
2. Go to **"Variables"** tab
3. Click **"Add Variable Reference"**
4. Select **DATABASE_URL** from Postgres service
5. Add these additional variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-random-secret-key
   JWT_REFRESH_SECRET=your-random-refresh-secret
   CORS_ORIGIN=http://localhost:3000
   ```

### Step 4: Generate Domain

1. Click on backend service → **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Note your URL: `https://xxx.up.railway.app`

### Step 5: Trigger Redeploy

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on latest deployment
3. Wait for deployment to complete
4. Check logs for "✅ Database ready"

### Step 6: Test API

```bash
curl https://your-backend.up.railway.app/health
curl -X POST https://your-backend.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test","role":"buyer"}'
```

---

## Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   ```
4. Deploy!

After Vercel deployment, update Railway backend CORS:
```
CORS_ORIGIN=https://your-app.vercel.app,http://localhost:3000
```

---

## What Happens on Deploy

1. **Build:** TypeScript compiles to JavaScript, schema.sql copied
2. **Start:** Server runs migrations automatically, then starts Express
3. **Migrations:** Creates all database tables if they don't exist

---

## Troubleshooting

**"relation does not exist" error:**
- Check if DATABASE_URL is set correctly
- Verify Postgres service is linked
- Redeploy backend

**502 errors:**
- Check backend logs in Railway dashboard
- Verify environment variables are set

**CORS errors:**
- Update CORS_ORIGIN with your frontend URL
- Include both http://localhost:3000 and production URL
