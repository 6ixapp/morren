# Deploy to Railway

Step-by-step guide to deploy the **backend** (Express API + PostgreSQL) to Railway. The frontend (Next.js) stays on Vercel or another host; set `NEXT_PUBLIC_API_URL` to the backend URL.

---

## 1. Create Railway project and PostgreSQL

1. Go to [railway.app](https://railway.app) and sign in (GitHub recommended).
2. **New Project**.
3. In the project, click **New** → **Database** → **PostgreSQL**. Railway creates a DB and exposes `DATABASE_URL` to services in the same project.
4. Click **New** → **GitHub Repo**. Select this repository and add the service.

---

## 2. Configure the backend service

1. Open the **backend service** (the one from GitHub, not Postgres).
2. **Settings** (or service settings):
   - **Root Directory**: set to `backend` (so all commands run from `backend/`).
   - **Config file path** (optional): if Railway does not auto-detect, set to `backend/railway.json`.
3. **Build** (can be set in UI or via [backend/railway.json](backend/railway.json)):
   - **Build Command**: `npm install && npm run build`
   - This runs `tsc` and the postbuild that copies `src/db/schema.sql` to `dist/db/schema.sql`.
4. **Deploy** (Start):
   - **Start Command**: `npm start` (runs `node dist/index.js`).
5. **Healthcheck**: the backend exposes `GET /health`. In Railway deploy settings you can set **Healthcheck Path** to `/health` (already in railway.json).

---

## 3. Environment variables (backend service)

In the backend service → **Variables** (or **Settings** → **Variables**):

| Variable | How to set | Required |
|----------|------------|----------|
| **DATABASE_URL** | **Add Variable** → **Reference** → select the PostgreSQL service → pick `DATABASE_URL` | Yes |
| **JWT_SECRET** | Add Variable → paste a strong random string (e.g. `openssl rand -base64 32`) | Yes |
| **JWT_REFRESH_SECRET** | Add Variable → paste a different strong random string | Yes |
| **CORS_ORIGIN** | Add Variable → your frontend origin, e.g. `https://your-app.vercel.app` (no trailing slash) | Yes |
| **JWT_EXPIRES_IN** | Optional; default in code: `1h` | No |
| **JWT_REFRESH_EXPIRES_IN** | Optional; default: `7d` | No |
| **NODE_ENV** | Optional; set to `production` | No |

**PORT** is set automatically by Railway; do not override unless needed.

---

## 4. Public URL for the backend

1. In the backend service, open **Settings** → **Networking** (or **Deploy** → **Settings**).
2. Under **Public Networking**, click **Generate Domain** (or **Add domain**).
3. Railway assigns a URL like `https://your-service-name-production-xxxx.up.railway.app`.
4. Copy this URL; you will use it as the API base URL for the frontend.

---

## 5. Deploy and verify

1. Trigger a deploy (push to the connected branch, or **Deploy** in Railway).
2. Wait for build and deploy to finish. Migrations run automatically on startup (see [backend/src/index.ts](backend/src/index.ts)).
3. Open `https://your-backend-url.up.railway.app/health` in a browser or curl; you should see `{"status":"ok","timestamp":"..."}`.
4. If migrations fail, check build logs to ensure `dist/db/schema.sql` exists (postbuild copies it). If not, add a build step that copies `src/db/schema.sql` to `dist/db/schema.sql`.

---

## 6. Frontend: point to the backend

The Next.js app uses [lib/api-client.ts](lib/api-client.ts) and reads `NEXT_PUBLIC_API_URL`.

1. **If the frontend is on Vercel** (or similar):
   - Project **Settings** → **Environment Variables**.
   - Add **NEXT_PUBLIC_API_URL** = `https://your-backend-url.up.railway.app` (no trailing slash).
   - Redeploy the frontend so the new value is applied.

2. **If the frontend is on Railway** (same repo, second service):
   - Add a new service from the same repo; **Root Directory** = `.` (repo root).
   - **Build**: `npm install && npm run build`
   - **Start**: `npm start`
   - In that service’s Variables, set **NEXT_PUBLIC_API_URL** = backend’s Railway URL (from step 4).

---

## 7. Optional: deploy Next.js to Railway (second service)

1. In the same Railway project, **New** → **GitHub Repo** → same repo.
2. **Root Directory**: `.` (repo root).
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Variables**: **NEXT_PUBLIC_API_URL** = backend’s public URL (from step 4).
6. **Generate Domain** for this service to get the frontend URL.
7. Set **CORS_ORIGIN** on the backend to this frontend URL (e.g. `https://your-frontend.up.railway.app`).

---

## 8. Troubleshooting

| Issue | What to do |
|-------|------------|
| Migrations fail on startup | Ensure postbuild ran: build logs should show schema copy, and `dist/db/schema.sql` should exist. |
| 502 Bad Gateway | App should listen on `PORT`; Express does this by default. Check deploy logs for errors. |
| CORS errors in browser | Set **CORS_ORIGIN** to the exact frontend origin (e.g. `https://your-app.vercel.app`), no trailing slash. |
| Database connection errors | Confirm **DATABASE_URL** is referenced from the Postgres service and both are in the same Railway project. |
| Health check fails | Backend exposes `GET /health`; set Healthcheck Path to `/health` in deploy settings. |

---

## 9. Summary checklist

- [ ] Railway project created; PostgreSQL added.
- [ ] Backend service added from GitHub; Root Directory = `backend`.
- [ ] Build: `npm install && npm run build`; Start: `npm start`.
- [ ] Variables: `DATABASE_URL` (reference), `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`.
- [ ] Public domain generated for backend; URL copied.
- [ ] Frontend env: `NEXT_PUBLIC_API_URL` = backend URL; frontend redeployed.
- [ ] `/health` returns OK; frontend can log in and call API.
