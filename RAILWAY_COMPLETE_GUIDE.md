# Railway All-in-One Deployment - Step by Step

Complete guide to deploy database and backend on Railway using the dashboard.

---

## Prerequisites

- Railway account (https://railway.app)
- GitHub account with this repository
- 15-20 minutes

---

## Part 1: Deploy PostgreSQL Database

### Step 1: Create New Project

1. Go to **https://railway.app**
2. Click **"New Project"**
3. You'll see your project dashboard

### Step 2: Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically provision the database
5. Wait 30-60 seconds for database to be ready
6. You'll see a **"Postgres"** service appear in your project

### Step 3: Get Database Connection Details

1. Click on the **Postgres** service card
2. Go to the **"Variables"** tab
3. You'll see these important variables:
   - `DATABASE_URL` - Internal connection string
   - `DATABASE_PUBLIC_URL` - External connection string (use this)
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

4. **Copy the `DATABASE_PUBLIC_URL`** - you'll need this for the backend

### Step 4: Run Database Migrations

**Option A: Using Railway CLI (Recommended)**

1. Open terminal in your project folder
2. Run:
   ```bash
   cd backend
   railway link   # Select your project
   railway run npm run migrate
   ```

**Option B: Copy-Paste SQL**

1. Copy all SQL from `backend/src/db/schema.sql`
2. In Railway dashboard, click on **Postgres** service
3. Go to **"Data"** tab
4. Click **"Query"**
5. Paste the SQL and click **"Run"**

**Option C: Connect with PostgreSQL Client**

1. Get connection details from Variables tab
2. Use TablePlus, pgAdmin, or psql:
   ```bash
   psql "postgresql://postgres:password@host:port/railway"
   ```
3. Run the SQL from `backend/src/db/schema.sql`

### Step 5: Verify Database Setup

1. In Railway dashboard, click **Postgres** service
2. Go to **"Data"** tab
3. You should see these tables:
   - users
   - items
   - orders
   - bids
   - shipping_bids
   - rfqs
   - rfq_suppliers
   - rfq_quotes
   - market_prices
   - buyer_profiles
   - notifications

✅ **Database is ready!**

---

## Part 2: Deploy Backend API

### Step 6: Create Backend Service

1. In your Railway project dashboard, click **"+ New"**
2. Select **"GitHub Repo"**
3. **Authorize GitHub** if prompted
4. Select your **morren** repository
5. Railway will create a new service

### Step 7: Configure Backend Service

1. Click on the new service (it might be called "morren" or "backend")
2. Go to **"Settings"** tab
3. Scroll to **"Service Settings"**

#### Set Root Directory:
- Find **"Root Directory"**
- Click **"Edit"**
- Enter: `backend`
- Click **"Update"**

#### Verify Build & Start Commands:
- **Build Command**: Should auto-detect as `npm run build`
- **Start Command**: Should auto-detect as `npm start`
- If not, set them manually in **"Settings"** → **"Deploy"**

### Step 8: Add Environment Variables

1. Stay in the backend service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** for each of these:

#### Required Variables:

**NODE_ENV**
```
production
```

**PORT**
```
8080
```

**DATABASE_URL**
```
${{Postgres.DATABASE_PUBLIC_URL}}
```
*Note: This references the Postgres service automatically*

**JWT_SECRET**
```
[Generate a random 32+ character string]
```
*Example: `morren-jwt-secret-key-2026-production-secure-random-string-xyz123`*

**JWT_REFRESH_SECRET**
```
[Generate a different random 32+ character string]
```
*Example: `morren-refresh-secret-key-2026-production-secure-random-string-abc456`*

**JWT_EXPIRES_IN**
```
1h
```

**JWT_REFRESH_EXPIRES_IN**
```
7d
```

**CORS_ORIGIN**
```
*
```
*Note: We'll update this after frontend deployment*

#### How to Generate Secure Secrets:

**Option 1 - Online Generator:**
- Go to https://randomkeygen.com/
- Use a "CodeIgniter Encryption Key" (256-bit)

**Option 2 - Command Line:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# OpenSSL
openssl rand -base64 32
```

### Step 9: Deploy Backend

1. After adding all variables, Railway will **automatically deploy**
2. You'll see **"Building..."** then **"Deploying..."**
3. Wait 2-3 minutes for the build to complete
4. Status should change to **"Active"** with a green dot

### Step 10: Get Backend URL

1. In backend service, go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Railway will create a URL like: `https://backend-production-xxxx.up.railway.app`
5. **Copy this URL** - you'll need it for the frontend

### Step 11: Test Backend API

Test your backend is working:

**Health Check:**
```
https://your-backend-url.railway.app/health
```
Should return: `{"status":"ok"}`

**API Test (using browser or Postman):**
```
POST https://your-backend-url.railway.app/api/auth/signup
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123",
  "role": "buyer"
}
```

### Step 12: View Backend Logs

1. Click on backend service
2. Go to **"Deployments"** tab
3. Click on the latest deployment
4. View **"Build Logs"** and **"Deploy Logs"**
5. Should see: `Server is running on port 8080`

✅ **Backend is live!**

---

## Part 3: Deploy Frontend (Optional - Next Steps)

### Step 13: Create Frontend Service

1. In Railway project, click **"+ New"**
2. Select **"GitHub Repo"**
3. Select the same **morren** repository
4. Railway creates another service

### Step 14: Configure Frontend Service

1. Click on the frontend service
2. Go to **"Settings"**
3. **Root Directory**: Leave blank or set to `.`
4. Verify:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Step 15: Add Frontend Environment Variables

Go to **"Variables"** tab and add:

**NODE_ENV**
```
production
```

**NEXT_PUBLIC_API_URL**
```
https://your-backend-url.railway.app
```
*Use the backend URL from Step 10 (no trailing slash)*

**NEXT_PUBLIC_SUPABASE_URL** (if using Supabase)
```
your-supabase-project-url
```

**NEXT_PUBLIC_SUPABASE_ANON_KEY** (if using Supabase)
```
your-supabase-anon-key
```

### Step 16: Deploy Frontend

1. Railway auto-deploys after adding variables
2. Wait 3-4 minutes for Next.js build
3. Status should show **"Active"**

### Step 17: Get Frontend URL

1. In frontend service, go to **"Settings"**
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Copy the frontend URL

### Step 18: Update Backend CORS

1. Go to **backend service**
2. Go to **"Variables"** tab
3. Find **"CORS_ORIGIN"**
4. Click **"Edit"**
5. Change from `*` to your frontend URL:
   ```
   https://your-frontend-url.railway.app
   ```
6. Click **"Update"**
7. Backend will automatically redeploy

✅ **Frontend is live!**

---

## Summary

Your Railway project now has:

1. ✅ **Postgres** - Database service
2. ✅ **Backend** - API service (backend folder)
3. ✅ **Frontend** - Next.js app (optional)

### URLs:

- **Backend API**: `https://backend-production-xxxx.up.railway.app`
- **Frontend**: `https://frontend-production-xxxx.up.railway.app`
- **Database**: Internal connection via Railway

### Automatic Features:

- ✅ Auto-deploy on git push
- ✅ HTTPS enabled
- ✅ Environment variables secured
- ✅ Logs and monitoring
- ✅ Automatic restarts
- ✅ Internal networking between services

---

## Troubleshooting

### Backend won't start

1. Check **"Deployments"** → **"Deploy Logs"**
2. Common issues:
   - Missing environment variables
   - Database connection failed
   - Build errors

**Fix:**
- Verify all 8 environment variables are set
- Check `DATABASE_URL` references `{{Postgres.DATABASE_PUBLIC_URL}}`
- Try manual redeploy: **Settings** → **"Redeploy"**

### Database connection error

1. Verify migrations ran successfully
2. Check `DATABASE_PUBLIC_URL` in Postgres service
3. Test connection:
   ```bash
   railway run --service backend npm run migrate
   ```

### Frontend can't reach backend

1. Verify `NEXT_PUBLIC_API_URL` has correct backend URL
2. Check backend `CORS_ORIGIN` includes frontend URL
3. Test backend URL in browser: `/health` endpoint

### Build fails

1. Check Node.js version compatibility
2. Review **Build Logs** for specific errors
3. Verify `package.json` has all dependencies

---

## Monitoring & Maintenance

### View Logs
1. Click on any service
2. Go to **"Deployments"**
3. Click latest deployment
4. View **Build** and **Deploy** logs

### Check Usage
1. Project dashboard
2. **"Usage"** tab shows:
   - Compute hours
   - Database storage
   - Network usage

### Redeploy
1. Go to service **"Settings"**
2. Click **"Redeploy"**
3. Or push to GitHub (auto-deploys)

### Add Custom Domain
1. Service **"Settings"**
2. **"Networking"** section
3. **"Custom Domain"**
4. Add your domain and configure DNS

---

## Cost

**Railway Free Tier:**
- $5 usage credits per month
- Includes all three services
- Automatic sleep after inactivity

**Paid Plan (if needed):**
- $5/month base
- Pay for actual usage
- No sleep/downtime

---

## Next Steps

1. ✅ Test all API endpoints
2. ✅ Set up custom domain (optional)
3. ✅ Configure GitHub auto-deploy
4. ✅ Add monitoring/alerts
5. ✅ Run database seeds (optional):
   ```bash
   railway run --service backend npm run seed
   ```

---

**🎉 Deployment Complete!**

Your application is now live on Railway with automatic deployments, monitoring, and HTTPS!
