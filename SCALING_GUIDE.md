# Morren Marketplace - Scaling Guide

**How to Scale Your Application for More Users**

This guide provides step-by-step instructions to scale your Morren Marketplace from 100 users to 100,000+ users.

---

## 🎯 Quick Reference: Scaling Stages

| Stage | Users | Req/s | Monthly Cost | Time to Implement | Difficulty |
|-------|-------|-------|--------------|-------------------|------------|
| **Stage 0** (Current) | 100-500 | 100-150 | $18-24 | - | - |
| **Stage 1** (Quick Wins) | 500-2,000 | 400-600 | $18-24 | 1 day | ⭐ Easy |
| **Stage 2** (Add Cache) | 2,000-5,000 | 800-1,200 | $33-39 | 1 week | ⭐⭐ Medium |
| **Stage 3** (Upgrade Server) | 5,000-10,000 | 1,500-2,500 | $78-108 | 2 weeks | ⭐⭐ Medium |
| **Stage 4** (Multi-Server) | 10,000-50,000 | 5,000-10,000 | $246-306 | 1 month | ⭐⭐⭐ Hard |
| **Stage 5** (Enterprise) | 50,000+ | 10,000+ | $500+ | 2-3 months | ⭐⭐⭐⭐ Expert |

---

## 📈 Stage 1: Quick Wins (0 → 2,000 Users)

**Goal:** 4x capacity increase with ZERO additional cost  
**Time Required:** 1 day  
**Difficulty:** ⭐ Easy  
**Cost:** $0

### Step 1.1: Enable PM2 Cluster Mode (4x Capacity)

**Current Setup:** 1 PM2 instance = 1 CPU core  
**New Setup:** 4 PM2 instances = 4 CPU cores  
**Impact:** 400-600 req/s (from 100-150 req/s)

#### Instructions:

```bash
# 1. SSH into your droplet
ssh root@api.zentrip.social

# 2. Navigate to backend directory
cd /opt/morren/backend

# 3. Edit ecosystem.config.js
nano ecosystem.config.js
```

**Change this:**
```javascript
module.exports = {
  apps: [{
    name: 'morren-backend',
    script: 'dist/index.js',
    cwd: '/opt/morren/backend',
    instances: 1,  // ← Change this
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    // ... rest of config
  }]
};
```

**To this:**
```javascript
module.exports = {
  apps: [{
    name: 'morren-backend',
    script: 'dist/index.js',
    cwd: '/opt/morren/backend',
    instances: 4,              // ← Use 4 CPU cores
    exec_mode: 'cluster',      // ← Add this line
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/morren/error.log',
    out_file: '/var/log/morren/out.log',
    merge_logs: true,
    time: true,
  }]
};
```

```bash
# 4. Reload PM2 with new configuration
pm2 reload ecosystem.config.js

# 5. Verify cluster mode is active
pm2 list
# You should see 4 instances of morren-backend

# 6. Check logs
pm2 logs morren-backend --lines 20

# 7. Test the API
curl https://api.zentrip.social/health
```

**Expected Output:**
```
┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ namespace   │ version │ mode    │ pid      │
├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ morren-backend     │ default     │ 1.0.0   │ cluster │ 12345    │
│ 1   │ morren-backend     │ default     │ 1.0.0   │ cluster │ 12346    │
│ 2   │ morren-backend     │ default     │ 1.0.0   │ cluster │ 12347    │
│ 3   │ morren-backend     │ default     │ 1.0.0   │ cluster │ 12348    │
└─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

✅ **Result:** Your app can now handle 400-600 req/s (4x increase)

---

### Step 1.2: Add Response Compression (60% Bandwidth Savings)

**Impact:** Faster response times, reduced bandwidth costs

#### Instructions:

```bash
# 1. Install compression package
cd /opt/morren/backend
npm install compression
npm install --save-dev @types/compression

# 2. Edit backend index.ts
nano src/index.ts
```

**Add compression import at the top:**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';  // ← Add this
import dotenv from 'dotenv';
```

**Add compression middleware (after helmet, before cors):**
```typescript
const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(helmet());
app.use(compression({           // ← Add this
  level: 6,                     // Compression level (0-9)
  threshold: 1024,              // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use(cors({ /* ... */ }));
```

```bash
# 3. Rebuild and restart
npm run build
pm2 restart morren-backend

# 4. Test compression
curl -H "Accept-Encoding: gzip" -I https://api.zentrip.social/api/items
# Look for "Content-Encoding: gzip" in headers
```

✅ **Result:** 60-80% smaller response sizes, faster load times

---

### Step 1.3: Add Rate Limiting (Prevent Abuse)

**Impact:** Protects against abuse, ensures fair resource allocation

#### Instructions:

```bash
# 1. Install rate limiting package
cd /opt/morren/backend
npm install express-rate-limit
npm install --save-dev @types/express-rate-limit

# 2. Edit backend index.ts
nano src/index.ts
```

**Add rate limit import:**
```typescript
import rateLimit from 'express-rate-limit';
```

**Add rate limiters (before routes):**
```typescript
// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // 100 requests per 15 minutes per IP
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,  // 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,  // Don't count successful logins
});

// Apply rate limiters
app.use('/api/', apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);
```

```bash
# 3. Rebuild and restart
npm run build
pm2 restart morren-backend

# 4. Test rate limiting
# Try making 6 requests quickly
for i in {1..6}; do curl -X POST https://api.zentrip.social/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"wrong"}'; done
# The 6th request should be rate limited
```

✅ **Result:** Protection against brute force attacks and API abuse

---

### Stage 1 Summary

**What You've Achieved:**
- ✅ 4x capacity increase (100 → 400-600 req/s)
- ✅ 60% bandwidth reduction
- ✅ Protection against abuse
- ✅ Can now handle 500-2,000 daily active users
- ✅ Total cost: $0
- ✅ Total time: 1 day

**Before Stage 1:**
- Concurrent users: 50-100
- Requests/second: 100-150
- Daily active users: 500

**After Stage 1:**
- Concurrent users: 200-400
- Requests/second: 400-600
- Daily active users: 2,000

---

## 🚀 Stage 2: Add Caching Layer (2,000 → 5,000 Users)

**Goal:** 50% reduction in database load  
**Time Required:** 1 week  
**Difficulty:** ⭐⭐ Medium  
**Cost:** +$15/month (Redis)

### Step 2.1: Deploy Redis Cache

#### Option A: Digital Ocean Managed Redis (Recommended)

```bash
# 1. Create Redis instance via Digital Ocean dashboard
# - Go to: https://cloud.digitalocean.com/databases
# - Click "Create Database"
# - Select: Redis
# - Plan: Basic ($15/month, 1GB RAM)
# - Region: Same as your droplet
# - Click "Create Database Cluster"

# 2. Get connection details
# - Copy the "Connection String" (looks like: redis://username:password@host:port)
# - Copy the "Public Network" connection details

# 3. Add to backend .env
ssh root@api.zentrip.social
nano /opt/morren/backend/.env
```

**Add to .env:**
```env
REDIS_URL=redis://default:your-password@your-redis-host:25061
```

#### Option B: Self-Hosted Redis (Free, but requires maintenance)

```bash
# 1. Install Redis on your droplet
ssh root@api.zentrip.social
sudo apt update
sudo apt install redis-server -y

# 2. Configure Redis
sudo nano /etc/redis/redis.conf
# Change: supervised no → supervised systemd
# Change: bind 127.0.0.1 ::1 (keep as is for security)

# 3. Start Redis
sudo systemctl restart redis.service
sudo systemctl enable redis

# 4. Test Redis
redis-cli ping
# Should return: PONG

# 5. Add to backend .env
nano /opt/morren/backend/.env
```

**Add to .env:**
```env
REDIS_URL=redis://localhost:6379
```

---

### Step 2.2: Implement Redis Caching in Backend

```bash
# 1. Install Redis client
cd /opt/morren/backend
npm install ioredis
npm install --save-dev @types/ioredis

# 2. Create Redis client file
nano src/utils/redis.ts
```

**Create `src/utils/redis.ts`:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

export default redis;
```

```bash
# 3. Create cache middleware
nano src/middleware/cache.ts
```

**Create `src/middleware/cache.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';
import redis from '../utils/redis';

export function cacheMiddleware(ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      // Try to get cached data
      const cached = await redis.get(key);
      
      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`Cache MISS: ${key}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data: any) => {
        redis.setex(key, ttl, JSON.stringify(data)).catch(err => {
          console.error('Cache set error:', err);
        });
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue without cache on error
    }
  };
}

// Helper to invalidate cache
export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}
```

```bash
# 4. Apply caching to routes
nano src/routes/itemRoutes.ts
```

**Update `src/routes/itemRoutes.ts`:**
```typescript
import { Router } from 'express';
import { cacheMiddleware, invalidateCache } from '../middleware/cache';
import * as itemController from '../controllers/itemController';

const router = Router();

// Cache items list for 5 minutes
router.get('/', cacheMiddleware(300), itemController.getItems);

// Cache active items for 5 minutes
router.get('/active', cacheMiddleware(300), itemController.getActiveItems);

// Cache individual item for 10 minutes
router.get('/:id', cacheMiddleware(600), itemController.getItemById);

// Invalidate cache when items are modified
router.post('/', async (req, res, next) => {
  await invalidateCache('cache:/api/items*');
  next();
}, itemController.createItem);

router.patch('/:id', async (req, res, next) => {
  await invalidateCache('cache:/api/items*');
  next();
}, itemController.updateItem);

router.delete('/:id', async (req, res, next) => {
  await invalidateCache('cache:/api/items*');
  next();
}, itemController.deleteItem);

export default router;
```

**Apply caching to other routes:**

```typescript
// src/routes/statsRoutes.ts
router.get('/buyer/:buyerId', cacheMiddleware(180), statsController.getBuyerStats);
router.get('/seller/:sellerId', cacheMiddleware(180), statsController.getSellerStats);
router.get('/admin', cacheMiddleware(120), statsController.getAdminStats);

// src/routes/marketPriceRoutes.ts
router.get('/', cacheMiddleware(1800), marketPriceController.getMarketPrices); // 30 min

// src/routes/orderRoutes.ts
router.get('/buyer/:buyerId', cacheMiddleware(60), orderController.getOrdersByBuyer);
```

```bash
# 5. Rebuild and restart
npm run build
pm2 restart morren-backend

# 6. Test caching
# First request (cache miss)
time curl https://api.zentrip.social/api/items

# Second request (cache hit - should be faster)
time curl https://api.zentrip.social/api/items

# Check Redis
redis-cli
> KEYS cache:*
> GET "cache:/api/items"
> TTL "cache:/api/items"
> exit
```

✅ **Result:** 50-70% reduction in database queries, faster response times

---

### Step 2.3: Optimize Database Connection Pool

```bash
# Edit database configuration
nano src/db/index.ts
```

**Update connection pool settings:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 10,                      // Minimum connections (increased from 2)
  max: 50,                      // Maximum connections (increased from 10)
  idleTimeoutMillis: 30000,     // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Timeout if can't get connection in 5s
  maxUses: 7500,                // Recycle connections after 7500 uses
});

// Monitor connection pool
pool.on('connect', (client) => {
  console.log('New database connection established');
});

pool.on('acquire', (client) => {
  console.log('Connection acquired from pool');
});

pool.on('error', (err, client) => {
  console.error('Unexpected database error:', err);
});

// Log pool stats periodically
setInterval(() => {
  console.log('DB Pool Stats:', {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  });
}, 60000); // Every minute

export default pool;
```

```bash
# Rebuild and restart
npm run build
pm2 restart morren-backend
```

✅ **Result:** 2x-3x concurrent query capacity

---

### Stage 2 Summary

**What You've Achieved:**
- ✅ 50-70% reduction in database load
- ✅ 2x faster response times for cached endpoints
- ✅ 3x database connection capacity
- ✅ Can now handle 2,000-5,000 daily active users
- ✅ Total additional cost: $15/month
- ✅ Total time: 1 week

**After Stage 2:**
- Concurrent users: 400-800
- Requests/second: 800-1,200
- Daily active users: 5,000
- Response time: 20-100ms (cached), 50-200ms (uncached)

---

## 💪 Stage 3: Upgrade Server (5,000 → 10,000 Users)

**Goal:** More CPU and RAM for better performance  
**Time Required:** 2 weeks  
**Difficulty:** ⭐⭐ Medium  
**Cost:** +$30-60/month

### Step 3.1: Upgrade Digital Ocean Droplet

#### Current Droplet:
- 1 vCPU
- 1GB RAM
- $18/month

#### Recommended Upgrade:
- 4 vCPU
- 8GB RAM
- $48/month

#### Instructions:

```bash
# Option A: Resize existing droplet (Recommended)

# 1. Create backup first
# - Go to: https://cloud.digitalocean.com/droplets
# - Click your droplet
# - Click "Snapshots" tab
# - Click "Take Snapshot"
# - Wait 5-10 minutes

# 2. Resize droplet
# - Click "Resize" tab
# - Select: "4 vCPU, 8GB RAM" ($48/month)
# - Click "Resize Droplet"
# - Wait 5-10 minutes for resize

# 3. Update PM2 to use more instances
ssh root@api.zentrip.social
cd /opt/morren/backend
nano ecosystem.config.js
```

**Update instances to match CPU count:**
```javascript
module.exports = {
  apps: [{
    name: 'morren-backend',
    script: 'dist/index.js',
    instances: 4,  // Keep at 4 or increase to 6-8
    exec_mode: 'cluster',
    max_memory_restart: '1G',  // Increase from 500M
    // ... rest
  }]
};
```

```bash
# 4. Reload PM2
pm2 reload ecosystem.config.js

# 5. Verify
pm2 list
free -h  # Check available RAM
nproc    # Check CPU count
```

✅ **Result:** 4x CPU power, 8x RAM, can handle 1,500-2,500 req/s

---

### Step 3.2: Migrate to Managed PostgreSQL

**Benefits:**
- Automated backups
- Point-in-time recovery
- High availability
- Better performance
- Dedicated resources

#### Instructions:

```bash
# 1. Create managed database
# - Go to: https://cloud.digitalocean.com/databases
# - Click "Create Database"
# - Select: PostgreSQL
# - Plan: Basic ($60/month, 4GB RAM, 2 vCPU)
# - Region: Same as your droplet
# - Click "Create Database Cluster"
# - Wait 5-10 minutes

# 2. Backup current database
ssh root@api.zentrip.social
pg_dump -U postgres morren_db > /tmp/morren_backup.sql

# 3. Get managed database connection string
# - Copy from Digital Ocean dashboard
# - Format: postgresql://username:password@host:port/database?sslmode=require

# 4. Restore to managed database
psql "postgresql://doadmin:password@your-db-host:25060/defaultdb?sslmode=require" < /tmp/morren_backup.sql

# 5. Update backend .env
nano /opt/morren/backend/.env
```

**Update DATABASE_URL:**
```env
DATABASE_URL=postgresql://doadmin:your-password@your-db-host:25060/defaultdb?sslmode=require
```

```bash
# 6. Restart backend
pm2 restart morren-backend

# 7. Test database connection
curl https://api.zentrip.social/api/items

# 8. Verify in logs
pm2 logs morren-backend --lines 50
# Look for: "✅ Database migrations complete"

# 9. If successful, remove old PostgreSQL from droplet (optional)
sudo systemctl stop postgresql
sudo systemctl disable postgresql
```

✅ **Result:** Better database performance, automated backups, high availability

---

### Stage 3 Summary

**What You've Achieved:**
- ✅ 4x CPU power (1 → 4 vCPU)
- ✅ 8x RAM (1GB → 8GB)
- ✅ Managed database with automated backups
- ✅ Can now handle 5,000-10,000 daily active users
- ✅ Total additional cost: $60-90/month
- ✅ Total time: 2 weeks

**After Stage 3:**
- Concurrent users: 800-1,500
- Requests/second: 1,500-2,500
- Daily active users: 10,000
- Monthly cost: $78-108

---

## 🌐 Stage 4: Multi-Server Setup (10,000 → 50,000 Users)

**Goal:** Horizontal scaling with load balancer  
**Time Required:** 1 month  
**Difficulty:** ⭐⭐⭐ Hard  
**Cost:** +$168/month

### Step 4.1: Create Load Balancer

```bash
# 1. Create load balancer via Digital Ocean dashboard
# - Go to: https://cloud.digitalocean.com/networking/load_balancers
# - Click "Create Load Balancer"
# - Region: Same as your droplets
# - Name: morren-lb
# - Forwarding Rules:
#   - HTTPS (443) → HTTP (5000)
#   - HTTP (80) → HTTP (5000) (redirect to HTTPS)
# - Health Check:
#   - Protocol: HTTP
#   - Port: 5000
#   - Path: /health
#   - Interval: 10 seconds
# - Sticky Sessions: Enabled (cookie-based)
# - Click "Create Load Balancer"
# - Cost: $12/month

# 2. Add SSL certificate
# - In load balancer settings
# - Click "Settings" → "SSL"
# - Add your domain certificate or use Let's Encrypt
```

---

### Step 4.2: Clone Backend Servers

```bash
# 1. Create snapshot of current droplet
# - Go to droplet settings
# - Click "Snapshots"
# - Take snapshot
# - Wait 10 minutes

# 2. Create 2 more droplets from snapshot
# - Click "Create" → "Droplets"
# - Select "Snapshots" tab
# - Choose your snapshot
# - Select: 4 vCPU, 8GB RAM ($48/month)
# - Quantity: 2
# - Names: morren-backend-2, morren-backend-3
# - Click "Create Droplets"

# 3. Add droplets to load balancer
# - Go to load balancer settings
# - Click "Droplets" tab
# - Add all 3 backend droplets
# - Click "Save"

# 4. Update DNS
# - Point api.zentrip.social to load balancer IP
# - Remove direct droplet IP from DNS
```

---

### Step 4.3: Configure Session Management

**Problem:** With multiple servers, user sessions need to be shared

**Solution:** Use Redis for session storage

```bash
# 1. Install session packages
ssh root@api.zentrip.social  # SSH into any backend server
cd /opt/morren/backend
npm install express-session connect-redis
npm install --save-dev @types/express-session @types/connect-redis

# 2. Update backend index.ts
nano src/index.ts
```

**Add session management:**
```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import redis from './utils/redis';

// Create Redis session store
const redisStore = new RedisStore({
  client: redis,
  prefix: 'session:',
});

// Add session middleware (before routes)
app.use(session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
}));
```

```bash
# 3. Rebuild on all servers
npm run build
pm2 restart morren-backend

# 4. Repeat on other servers
ssh root@morren-backend-2
cd /opt/morren/backend
git pull
npm install
npm run build
pm2 restart morren-backend

ssh root@morren-backend-3
cd /opt/morren/backend
git pull
npm install
npm run build
pm2 restart morren-backend
```

---

### Step 4.4: Test Load Balancer

```bash
# 1. Test health check
curl https://api.zentrip.social/health

# 2. Test load distribution
for i in {1..10}; do
  curl -s https://api.zentrip.social/health | jq
  sleep 1
done

# 3. Monitor which server handles requests
# Add server identifier to health check response
nano src/index.ts
```

**Update health check:**
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: process.env.HOSTNAME || 'unknown',
    pid: process.pid,
  });
});
```

```bash
# Rebuild and test
npm run build
pm2 restart morren-backend

# Test again
for i in {1..10}; do
  curl -s https://api.zentrip.social/health
  echo ""
done
# You should see different PIDs, confirming load balancing
```

---

### Stage 4 Summary

**What You've Achieved:**
- ✅ 3 backend servers (horizontal scaling)
- ✅ Load balancer distributing traffic
- ✅ Shared session management via Redis
- ✅ High availability (if one server fails, others continue)
- ✅ Can now handle 10,000-50,000 daily active users
- ✅ Total additional cost: $168/month
- ✅ Total time: 1 month

**After Stage 4:**
- Concurrent users: 2,000-4,000
- Requests/second: 5,000-10,000
- Daily active users: 50,000
- Monthly cost: $246-306
- Servers: 3 backend + 1 load balancer

**Infrastructure:**
```
Load Balancer ($12/month)
├── Backend Server 1 (4 vCPU, 8GB) - $48/month
├── Backend Server 2 (4 vCPU, 8GB) - $48/month
└── Backend Server 3 (4 vCPU, 8GB) - $48/month

Managed PostgreSQL (4GB) - $60/month
Managed Redis (1GB) - $15/month

Total: $231/month
```

---

## 🚀 Stage 5: Enterprise Setup (50,000+ Users)

**Goal:** Auto-scaling, high availability, global distribution  
**Time Required:** 2-3 months  
**Difficulty:** ⭐⭐⭐⭐ Expert  
**Cost:** $500-1,500/month

### Overview

At this scale, you need:
- **Kubernetes** for container orchestration
- **Auto-scaling** based on load
- **Database read replicas** for read-heavy operations
- **CDN** for API responses
- **Advanced monitoring** and alerting
- **Multi-region deployment** (optional)

### Step 5.1: Migrate to Kubernetes

```bash
# 1. Create Digital Ocean Kubernetes cluster
# - Go to: https://cloud.digitalocean.com/kubernetes
# - Click "Create Kubernetes Cluster"
# - Version: Latest stable
# - Node pool: 3 nodes, 4 vCPU, 8GB RAM each
# - Cost: ~$144/month

# 2. Install kubectl locally
# - Download from: https://kubernetes.io/docs/tasks/tools/
# - Configure with cluster credentials from Digital Ocean

# 3. Create Dockerfile for backend
cd /opt/morren/backend
nano Dockerfile
```

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start app
CMD ["node", "dist/index.js"]
```

```bash
# 4. Build and push Docker image
docker build -t morren-backend:latest .
docker tag morren-backend:latest registry.digitalocean.com/your-registry/morren-backend:latest
docker push registry.digitalocean.com/your-registry/morren-backend:latest

# 5. Create Kubernetes deployment
nano k8s-deployment.yaml
```

**Create `k8s-deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: morren-backend
spec:
  replicas: 5  # Start with 5 pods
  selector:
    matchLabels:
      app: morren-backend
  template:
    metadata:
      labels:
        app: morren-backend
    spec:
      containers:
      - name: morren-backend
        image: registry.digitalocean.com/your-registry/morren-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: morren-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: morren-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: morren-backend-service
spec:
  selector:
    app: morren-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: morren-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: morren-backend
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

```bash
# 6. Deploy to Kubernetes
kubectl apply -f k8s-deployment.yaml

# 7. Verify deployment
kubectl get pods
kubectl get services
kubectl get hpa

# 8. Monitor auto-scaling
kubectl get hpa morren-backend-hpa --watch
```

---

### Step 5.2: Add Database Read Replicas

```bash
# 1. Create read replica in Digital Ocean
# - Go to your managed database
# - Click "Add Read-Only Node"
# - Select same region
# - Click "Create"
# - Cost: +$60/month per replica

# 2. Update backend to use read replica for read operations
nano src/db/index.ts
```

**Create separate pools for read/write:**
```typescript
import { Pool } from 'pg';

// Primary database (for writes)
export const writePool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});

// Read replica (for reads)
export const readPool = new Pool({
  connectionString: process.env.DATABASE_READ_URL,
  max: 50,
});

// Helper function to choose pool
export function getPool(operation: 'read' | 'write' = 'read') {
  return operation === 'write' ? writePool : readPool;
}
```

**Update controllers to use read pool:**
```typescript
// For read operations
const items = await readPool.query('SELECT * FROM items');

// For write operations
const result = await writePool.query('INSERT INTO items ...');
```

---

### Step 5.3: Add Advanced Monitoring

```bash
# 1. Install Prometheus and Grafana
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

# 2. Install metrics server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 3. Create monitoring dashboard
# - Use Grafana to visualize metrics
# - Monitor: CPU, memory, request rate, error rate, response time

# 4. Set up alerts
# - CPU > 80% for 5 minutes
# - Memory > 90%
# - Error rate > 1%
# - Response time > 1 second
```

---

### Stage 5 Summary

**What You've Achieved:**
- ✅ Kubernetes auto-scaling (5-20 pods)
- ✅ Database read replicas for better performance
- ✅ Advanced monitoring and alerting
- ✅ Can handle 50,000-200,000+ daily active users
- ✅ Auto-scales based on load
- ✅ Total cost: $500-1,500/month

**After Stage 5:**
- Concurrent users: 10,000-40,000
- Requests/second: 20,000-50,000+
- Daily active users: 200,000+
- Monthly cost: $500-1,500
- Infrastructure: Kubernetes cluster with auto-scaling

---

## 📊 Quick Reference: Scaling Checklist

### When to Scale

| Metric | Stage 1 | Stage 2 | Stage 3 | Stage 4 | Stage 5 |
|--------|---------|---------|---------|---------|---------|
| **Daily Active Users** | 500 | 2,000 | 5,000 | 10,000 | 50,000+ |
| **Concurrent Users** | 100 | 400 | 800 | 2,000 | 10,000+ |
| **Requests/Second** | 150 | 600 | 1,500 | 5,000 | 20,000+ |
| **CPU Usage** | >70% | >70% | >70% | >70% | >70% |
| **Response Time** | >500ms | >500ms | >500ms | >500ms | >500ms |

### Cost Summary

| Stage | Infrastructure | Monthly Cost | One-Time Setup |
|-------|---------------|--------------|----------------|
| **Current** | 1 droplet | $18-24 | - |
| **Stage 1** | 1 droplet (optimized) | $18-24 | $0 |
| **Stage 2** | 1 droplet + Redis | $33-39 | $0 |
| **Stage 3** | Upgraded droplet + Managed DB + Redis | $78-108 | $0 |
| **Stage 4** | 3 droplets + LB + Managed DB + Redis | $246-306 | $0 |
| **Stage 5** | Kubernetes + Replicas + Monitoring | $500-1,500 | $100-500 |

---

## 🎯 Recommended Scaling Path

### For Most Users:

```
Current (500 DAU)
    ↓
Stage 1: Quick Wins (2,000 DAU) ← START HERE
    ↓ [When you hit 1,500 DAU]
Stage 2: Add Cache (5,000 DAU)
    ↓ [When you hit 4,000 DAU]
Stage 3: Upgrade Server (10,000 DAU)
    ↓ [When you hit 8,000 DAU]
Stage 4: Multi-Server (50,000 DAU)
    ↓ [When you hit 40,000 DAU]
Stage 5: Enterprise (200,000+ DAU)
```

### Start with Stage 1 TODAY:
1. Enable PM2 cluster mode (30 minutes)
2. Add compression (15 minutes)
3. Add rate limiting (30 minutes)

**Total time:** 1-2 hours  
**Total cost:** $0  
**Capacity increase:** 4x

---

## 🆘 Troubleshooting

### Common Issues

#### Issue: PM2 cluster mode not working
```bash
# Check PM2 status
pm2 list
pm2 describe morren-backend

# Verify cluster mode
pm2 logs morren-backend | grep cluster

# Restart with cluster mode
pm2 delete morren-backend
pm2 start ecosystem.config.js --env production
```

#### Issue: Redis connection errors
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
sudo journalctl -u redis -n 50

# Restart Redis
sudo systemctl restart redis
```

#### Issue: Database connection pool exhausted
```bash
# Check active connections
psql -U postgres -d morren_db -c "SELECT count(*) FROM pg_stat_activity;"

# Increase pool size in code
# Edit src/db/index.ts and increase max: 50 → max: 100
```

#### Issue: High memory usage
```bash
# Check memory usage
free -h
pm2 monit

# Restart PM2 instances
pm2 restart morren-backend

# Reduce max_memory_restart if needed
# Edit ecosystem.config.js: max_memory_restart: '500M'
```

---

## 📞 Support Resources

### Monitoring Commands

```bash
# Check server resources
htop              # CPU and memory usage
df -h             # Disk usage
free -h           # RAM usage
netstat -tuln     # Network connections

# Check PM2
pm2 list          # List all processes
pm2 monit         # Real-time monitoring
pm2 logs          # View logs
pm2 describe 0    # Detailed info

# Check database
psql -U postgres -d morren_db -c "SELECT * FROM pg_stat_activity;"

# Check Redis
redis-cli INFO
redis-cli DBSIZE
```

### Performance Testing

```bash
# Install Apache Bench
sudo apt install apache2-utils

# Test API performance
ab -n 1000 -c 10 https://api.zentrip.social/health
ab -n 100 -c 5 https://api.zentrip.social/api/items

# Test with authentication
ab -n 100 -c 5 -H "Authorization: Bearer YOUR_TOKEN" https://api.zentrip.social/api/orders
```

---

## 🎉 Conclusion

You now have a complete roadmap to scale your Morren Marketplace from 100 users to 100,000+ users!

**Next Steps:**
1. ✅ Implement Stage 1 today (1-2 hours, $0 cost)
2. ✅ Monitor your growth and user metrics
3. ✅ Scale to Stage 2 when you reach 1,500 DAU
4. ✅ Continue following the roadmap as you grow

**Remember:**
- Start small, scale gradually
- Monitor your metrics
- Optimize before adding more servers
- Test thoroughly after each change

Good luck scaling your marketplace! 🚀

---

**Document Version:** 1.0  
**Last Updated:** February 16, 2026  
**Next Review:** When DAU exceeds 1,500
