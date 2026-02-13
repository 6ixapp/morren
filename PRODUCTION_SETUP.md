# Production Setup - api.zentrip.social

Your API is now live at **https://api.zentrip.social** 🎉

## ✅ Changes Already Made

### 1. Local Environment Files Updated
- ✅ `.env.local` - Updated to `https://api.zentrip.social`
- ✅ `.env` - Added `NEXT_PUBLIC_API_URL=https://api.zentrip.social`

---

## 🔧 Additional Changes Needed

### 2. Update Backend CORS (On Droplet)

Your backend needs to allow requests from your frontend domain.

**SSH into your droplet:**
```bash
ssh root@YOUR_DROPLET_IP
```

**Edit backend .env:**
```bash
nano /opt/morren/.env
```

**Update CORS_ORIGIN:**
```bash
# Change from:
CORS_ORIGIN=*

# To your frontend URL (update with your actual frontend domain):
CORS_ORIGIN=https://your-frontend-domain.com

# Or if deploying frontend to Vercel:
CORS_ORIGIN=https://your-app.vercel.app

# Or allow multiple origins (comma-separated):
CORS_ORIGIN=https://your-frontend.com,https://www.your-frontend.com
```

**Restart backend:**
```bash
pm2 reload morren-backend
```

---

### 3. Deploy Frontend to Vercel (Recommended)

**Install Vercel CLI:**
```bash
npm i -g vercel
```

**Deploy:**
```bash
cd d:\morren
vercel --prod
```

**During deployment, Vercel will ask for environment variables. Add:**
```
NEXT_PUBLIC_API_URL=https://api.zentrip.social
NEXT_PUBLIC_SUPABASE_URL=https://zuwfcmzcvgyfxqqisaal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Or add them in Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_API_URL` = `https://api.zentrip.social`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://zuwfcmzcvgyfxqqisaal.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your key)

---

### 4. Update CORS After Frontend Deployment

After deploying frontend to Vercel, you'll get a URL like `https://morren-xyz.vercel.app`

**SSH back into droplet:**
```bash
ssh root@YOUR_DROPLET_IP
nano /opt/morren/.env
```

**Update CORS_ORIGIN with your Vercel URL:**
```bash
CORS_ORIGIN=https://morren-xyz.vercel.app
```

**Restart backend:**
```bash
pm2 reload morren-backend
```

---

## 🧪 Testing Your Setup

### Test API Health
```bash
curl https://api.zentrip.social/health
```

**Expected response:**
```json
{"status":"ok"}
```

### Test API Endpoints
```bash
# Test signup
curl -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "buyer"
  }'
```

### Test from Frontend
Once your frontend is deployed:
1. Open your Vercel URL
2. Try signing up
3. Try logging in
4. Check browser console for any CORS errors

---

## 🔍 Common Issues & Solutions

### Issue: CORS Error in Browser Console

**Error:**
```
Access to fetch at 'https://api.zentrip.social' from origin 'https://your-app.vercel.app' 
has been blocked by CORS policy
```

**Solution:**
1. SSH into droplet
2. Update `CORS_ORIGIN` in `/opt/morren/.env` to include your frontend URL
3. Restart: `pm2 reload morren-backend`

### Issue: API Returns 404

**Check:**
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Check if backend is running
pm2 status

# Check logs
pm2 logs morren-backend

# Check Nginx
systemctl status nginx
```

### Issue: SSL Certificate Error

**Check certificate:**
```bash
curl -I https://api.zentrip.social
```

**Renew if needed:**
```bash
ssh root@YOUR_DROPLET_IP
certbot renew --nginx
```

---

## 📝 Environment Variables Summary

### Local Development (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.zentrip.social
NEXT_PUBLIC_SUPABASE_URL=https://zuwfcmzcvgyfxqqisaal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

### Production Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://api.zentrip.social
NEXT_PUBLIC_SUPABASE_URL=https://zuwfcmzcvgyfxqqisaal.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
```

### Production Backend (Droplet: /opt/morren/.env)
```bash
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://morren_user:YOUR_PASSWORD@localhost:5432/morren_db
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 🚀 Quick Deployment Checklist

- [x] API deployed to Digital Ocean (api.zentrip.social)
- [x] Local .env files updated
- [ ] Backend CORS updated with frontend URL
- [ ] Frontend deployed to Vercel
- [ ] Vercel environment variables configured
- [ ] Backend CORS updated with Vercel URL
- [ ] Tested API health endpoint
- [ ] Tested signup/login flow
- [ ] Checked browser console for errors

---

## 🎯 Next Steps

1. **Deploy Frontend to Vercel** (see step 3 above)
2. **Update Backend CORS** with your Vercel URL (see step 4 above)
3. **Test Everything** - signup, login, create orders, etc.
4. **Monitor Logs** - `pm2 logs morren-backend` on droplet
5. **Setup Monitoring** - Use UptimeRobot to monitor `https://api.zentrip.social/health`

---

## 📞 Useful Commands

### Check API Status
```bash
curl https://api.zentrip.social/health
```

### SSH into Droplet
```bash
ssh root@YOUR_DROPLET_IP
```

### Check Backend Logs
```bash
ssh root@YOUR_DROPLET_IP
pm2 logs morren-backend
```

### Restart Backend
```bash
ssh root@YOUR_DROPLET_IP
pm2 reload morren-backend
```

### Deploy Frontend
```bash
cd d:\morren
vercel --prod
```

---

**Your API is live! 🎉** Now deploy your frontend and update CORS to complete the setup.
