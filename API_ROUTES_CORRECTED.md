# ⚠️ CORRECTED API Routes for api.zentrip.social

## 🔧 Important: Route Prefix

Your backend uses these route prefixes:
- **Auth routes:** `/auth/*` (NO /api prefix)
- **All other routes:** `/api/*` (WITH /api prefix)

---

## ✅ Quick Reference - Correct Routes

### Authentication (NO /api prefix)
- ✅ `/auth/signup`
- ✅ `/auth/login`
- ✅ `/auth/me`
- ✅ `/auth/refresh`

### All Other Endpoints (WITH /api prefix)
- ✅ `/api/users`
- ✅ `/api/items`
- ✅ `/api/orders`
- ✅ `/api/bids`
- ✅ `/api/shipping-bids`
- ✅ `/api/stats`
- ✅ `/api/suppliers`
- ✅ `/api/rfqs`
- ✅ `/api/market-prices`
- ✅ `/api/buyer-profiles`
- ✅ `/api/notifications`

---

## 🧪 Corrected Test Commands

### 1. Health Check ✅
```bash
curl https://api.zentrip.social/health
```

### 2. Signup (NO /api) ✅
```bash
curl -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "buyer"
  }'
```

### 3. Login (NO /api) ✅
```bash
curl -X POST https://api.zentrip.social/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 4. Get Profile (NO /api) ✅
```bash
curl https://api.zentrip.social/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. List Items (WITH /api) ✅
```bash
curl https://api.zentrip.social/api/items
```

### 6. Get Single Item (WITH /api) ✅
```bash
curl https://api.zentrip.social/api/items/1
```

### 7. Create Order (WITH /api) ✅
```bash
curl -X POST https://api.zentrip.social/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "quantity": 10,
    "order_type": "fixed_price"
  }'
```

### 8. List My Orders (WITH /api) ✅
```bash
curl https://api.zentrip.social/api/orders/my-orders \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Create Bid (WITH /api) ✅
```bash
curl -X POST https://api.zentrip.social/api/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "bid_amount": 275.00,
    "delivery_date": "2026-02-25"
  }'
```

### 10. Get Stats (WITH /api) ✅
```bash
curl https://api.zentrip.social/api/stats/buyer \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔥 Complete Test Flow

```bash
# 1. Health Check
curl https://api.zentrip.social/health

# 2. Signup
SIGNUP_RESPONSE=$(curl -s -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Test123!",
    "name": "New User",
    "role": "buyer"
  }')

echo $SIGNUP_RESPONSE

# 3. Extract token (if using jq)
TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"

# 4. Get profile
curl https://api.zentrip.social/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. List items
curl https://api.zentrip.social/api/items

# 6. Get specific item
curl https://api.zentrip.social/api/items/1
```

---

## 📝 PowerShell Version (Windows)

```powershell
# 1. Health Check
Invoke-RestMethod -Uri "https://api.zentrip.social/health"

# 2. Signup
$signupBody = @{
    email = "test@example.com"
    password = "Test123!"
    name = "Test User"
    role = "buyer"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.zentrip.social/auth/signup" `
    -Method POST `
    -ContentType "application/json" `
    -Body $signupBody

$token = $response.token
Write-Host "Token: $token"

# 3. Get Profile
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "https://api.zentrip.social/auth/me" `
    -Headers $headers

# 4. List Items
Invoke-RestMethod -Uri "https://api.zentrip.social/api/items"
```

---

## ❌ Common Mistakes

### WRONG ❌
```bash
# Missing /api for items
curl https://api.zentrip.social/items  # 404 Error!

# Adding /api to auth
curl https://api.zentrip.social/api/auth/login  # 404 Error!
```

### CORRECT ✅
```bash
# Items WITH /api
curl https://api.zentrip.social/api/items  # ✅ Works!

# Auth WITHOUT /api
curl https://api.zentrip.social/auth/login  # ✅ Works!
```

---

## 🎯 All Endpoints Reference

### Auth Endpoints (NO /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Get profile |
| POST | `/auth/refresh` | Refresh token |

### User Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/:id` | Get user (admin) |
| PUT | `/api/users/:id` | Update user (admin) |
| DELETE | `/api/users/:id` | Delete user (admin) |

### Item Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | List items |
| GET | `/api/items/:id` | Get item |
| POST | `/api/items` | Create item (admin) |
| PUT | `/api/items/:id` | Update item (admin) |
| DELETE | `/api/items/:id` | Delete item (admin) |

### Order Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders (admin) |
| GET | `/api/orders/my-orders` | My orders |
| GET | `/api/orders/:id` | Get order |
| POST | `/api/orders` | Create order |
| PUT | `/api/orders/:id` | Update order |
| DELETE | `/api/orders/:id` | Delete order |

### Bid Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bids` | List bids |
| GET | `/api/bids/my-bids` | My bids |
| GET | `/api/orders/:id/bids` | Bids for order |
| POST | `/api/bids` | Create bid |
| PUT | `/api/bids/:id/accept` | Accept bid |
| PUT | `/api/bids/:id/reject` | Reject bid |

### Shipping Bid Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shipping-bids` | List shipping bids |
| POST | `/api/shipping-bids` | Create shipping bid |
| PUT | `/api/shipping-bids/:id/accept` | Accept shipping bid |

### Stats Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/buyer` | Buyer stats |
| GET | `/api/stats/seller` | Seller stats |
| GET | `/api/stats/shipping-provider` | Shipper stats |
| GET | `/api/stats/admin` | Admin stats |

### RFQ Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rfqs` | List RFQs |
| GET | `/api/rfqs/:id` | Get RFQ |
| POST | `/api/rfqs` | Create RFQ |
| POST | `/api/rfqs/:id/invite` | Invite supplier |

### Market Price Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/market-prices` | List prices |
| POST | `/api/market-prices` | Add price (admin) |

### Notification Endpoints (WITH /api)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | My notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

---

## 🚀 Ready to Test!

Use these corrected routes and your API will work perfectly! 

**Remember:**
- Auth = NO `/api`
- Everything else = WITH `/api`
