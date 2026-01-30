# 🚂 Railway Deployment Guide

## Quick Deploy (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your repository

### Step 3: Add PostgreSQL Database

1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically creates `DATABASE_URL` environment variable
3. Wait for database to provision (~30 seconds)

### Step 4: Configure Backend Service

1. Click on your backend service
2. Go to **"Settings"** → **"Root Directory"**
3. Set to: `backend`
4. Go to **"Variables"** tab and add:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-random-secret-key-here
JWT_REFRESH_SECRET=your-random-refresh-secret-here
CORS_ORIGIN=https://your-app.vercel.app
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Run Database Migrations

1. Go to backend service → **"Deployments"** tab
2. Click on latest deployment → **"View Logs"**
3. Once deployed, run migrations:
   - Click service → **"Settings"** → **"Custom Start Command"**
   - Temporarily set: `npm run migrate && npm start`
   - Redeploy
   - After first deploy, change back to: `npm start`

### Step 6: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
   ```
4. Deploy! ✅

### Step 7: Update Backend CORS

1. Go back to Railway → Backend service → Variables
2. Update `CORS_ORIGIN` with your Vercel URL
3. Redeploy backend

---

## 🎯 Your URLs

**Backend API:** `https://your-backend.up.railway.app`
**Frontend:** `https://your-app.vercel.app`
**Database:** Managed by Railway (internal)

---

## 📊 Monitoring

**Railway Dashboard:**
- View logs in real-time
- Monitor CPU/Memory usage
- Check database connections
- View deployment history

**Metrics Tab:**
- Request counts
- Response times
- Error rates

---

## 🔄 Updating Your App

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main
```

Railway auto-deploys on every push! 🚀

---

## 💰 Pricing

**Trial:** $5 credit (lasts ~1 week)
**Hobby Plan:** $5/month (execute time) + $0.02/GB RAM/hour
**Estimated Cost:** ~$8-12/month for this app

---

## 🐛 Troubleshooting

**Backend won't start:**
- Check logs for errors
- Verify `DATABASE_URL` is set
- Ensure migrations ran successfully

**Database connection fails:**
- Check if PostgreSQL service is running
- Verify `DATABASE_URL` format
- Check service linking in Railway dashboard

**CORS errors:**
- Update `CORS_ORIGIN` with exact frontend URL
- Include `https://` in URL
- Redeploy backend after changing

---

## 🔐 Security Checklist

- ✅ Changed JWT secrets from defaults
- ✅ Set `NODE_ENV=production`
- ✅ Updated CORS_ORIGIN to your domain
- ✅ Database backups enabled (automatic in Railway)

---

## 📝 Post-Deployment

1. Test all API endpoints
2. Create admin user (via API or database)
3. Test authentication flow
4. Verify database persistence
5. Check logs for errors

**Create Admin User:**
```bash
# Use Railway CLI or database console
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Admin', 'admin@example.com', 'hashed-password', 'admin');
```

Or use the `/auth/register` endpoint and manually update role in database.

---

## 🎉 Done!

Your app is now live on Railway with:
- ✅ Always-on backend (no cold starts)
- ✅ Managed PostgreSQL
- ✅ Automatic deployments
- ✅ Free SSL certificates
- ✅ Built-in monitoring

Questions? Check Railway docs: https://docs.railway.app
