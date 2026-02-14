# ⚠️ IMPORTANT: Update Your .env File

## Action Required

You need to update your `.env` file with new JWT token settings for the login persistence fix to work.

---

## Step 1: Locate Your .env File

The file is located at:
```
/d/morren/backend/.env
```

---

## Step 2: Update JWT Settings

Find these lines in your `.env` file:
```env
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

**Replace them with:**
```env
# Access Token: Short-lived for security (1-4 hours recommended)
JWT_EXPIRES_IN=4h

# Refresh Token: Long-lived for mobile app persistence (30 days recommended)
# This allows users to stay logged in for up to 30 days on mobile devices
JWT_REFRESH_EXPIRES_IN=30d
```

---

## Step 3: Restart Your Backend Server

### If using npm/node:
```bash
# Stop the server (Ctrl+C)

# Start again
npm run dev
```

### If using Railway:
1. Go to Railway dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Update:
   - `JWT_EXPIRES_IN` → `4h`
   - `JWT_REFRESH_EXPIRES_IN` → `30d`
5. Save changes
6. Railway will auto-redeploy

### If using PM2:
```bash
pm2 restart backend
```

---

## Step 4: Verify Changes

After restarting, check the logs to confirm:
```bash
# You should see
🚀 Server is running on port 5000
📍 Environment: production
```

---

## What This Does

### Before:
- ❌ Access token expires after 1 hour
- ❌ Refresh token expires after 7 days
- ❌ Users must login again after 7 days

### After:
- ✅ Access token expires after 4 hours
- ✅ Refresh token expires after 30 days
- ✅ Users stay logged in for up to 30 days (even after closing app)

---

## Testing

After updating, test on your mobile app:

1. Login to the app
2. Close the app completely
3. Wait a few hours
4. Reopen the app
5. ✅ Should automatically login (session restored)

---

## Troubleshooting

### "Users still need to login after closing app"

**Check:**
1. Did you restart the backend after updating .env?
2. Did you update BOTH `JWT_EXPIRES_IN` and `JWT_REFRESH_EXPIRES_IN`?
3. Check backend logs for errors

**Solution:**
```bash
# Verify your .env file
cat .env | grep JWT

# Should show:
# JWT_EXPIRES_IN=4h
# JWT_REFRESH_EXPIRES_IN=30d
```

### "Backend won't start"

**Check:**
1. Make sure there are no syntax errors in .env
2. Make sure you didn't accidentally delete other important variables
3. Check backend logs for specific error messages

---

## Important Notes

- ✅ This change is **backward compatible**
- ✅ Existing users will get new tokens on next login
- ✅ Old tokens will still work until they expire
- ✅ No database changes required
- ✅ No frontend changes required (mobile app already handles this)

---

## Need Help?

If you encounter issues:
1. Check the backend logs for error messages
2. Verify your .env file has the correct values
3. Make sure the backend server restarted successfully
4. Test with a fresh login on mobile app
