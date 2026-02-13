# API Testing with cURL - api.zentrip.social

Complete curl test suite for all API endpoints.

**Base URL:** `https://api.zentrip.social`

---

## 🧪 Test Sequence

Follow this order to test all functionality:

1. [Health Check](#1-health-check)
2. [User Signup](#2-user-signup)
3. [User Login](#3-user-login)
4. [Get User Profile](#4-get-user-profile)
5. [Create Item (Admin)](#5-create-item-admin)
6. [List Items](#6-list-items)
7. [Create Order](#7-create-order)
8. [List Orders](#8-list-orders)
9. [Create Bid](#9-create-bid)
10. [List Bids](#10-list-bids)

---

## 1. Health Check

**Test if API is running:**

```bash
curl https://api.zentrip.social/health
```

**Expected Response:**
```json
{"status":"ok"}
```

---

## 2. User Signup

### 2.1 Signup as Buyer

```bash
curl -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "Buyer123!",
    "name": "Test Buyer",
    "role": "buyer",
    "company_name": "Test Company"
  }'
```

**Expected Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "buyer@test.com",
    "name": "Test Buyer",
    "role": "buyer",
    "company_name": "Test Company"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.2 Signup as Seller

```bash
curl -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@test.com",
    "password": "Seller123!",
    "name": "Test Seller",
    "role": "seller",
    "company_name": "Seller Corp"
  }'
```

### 2.3 Signup as Shipping Provider

```bash
curl -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shipper@test.com",
    "password": "Shipper123!",
    "name": "Test Shipper",
    "role": "shipping_provider",
    "company_name": "Fast Shipping Inc"
  }'
```

### 2.4 Signup as Admin (Restricted)

```bash
curl -X POST https://api.zentrip.social/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "name": "Test Admin",
    "role": "admin"
  }'
```

**Expected Response (Error):**
```json
{
  "error": "Admin accounts must be created by existing admins"
}
```

---

## 3. User Login

### 3.1 Login as Buyer

```bash
curl -X POST https://api.zentrip.social/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "Buyer123!"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "buyer@test.com",
    "name": "Test Buyer",
    "role": "buyer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**💡 Save the token for authenticated requests:**
```bash
# Save token to variable (Linux/Mac)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Or on Windows PowerShell
$TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3.2 Login with Wrong Password

```bash
curl -X POST https://api.zentrip.social/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "buyer@test.com",
    "password": "WrongPassword"
  }'
```

**Expected Response (Error):**
```json
{
  "error": "Invalid credentials"
}
```

---

## 4. Get User Profile

**Get current user's profile (requires authentication):**

```bash
curl https://api.zentrip.social/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "id": 1,
  "email": "buyer@test.com",
  "name": "Test Buyer",
  "role": "buyer",
  "company_name": "Test Company",
  "created_at": "2026-02-13T18:00:00.000Z"
}
```

---

## 5. Create Item (Admin)

**First, login as admin to get token:**

```bash
# You'll need to create admin via database or existing admin
# For testing, you can use the seed data if available
```

**Create a new item:**

```bash
curl -X POST https://api.zentrip.social/items \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes from local farm",
    "price": 299.99,
    "category": "Vegetables",
    "quantity": 100,
    "unit": "kg",
    "image_url": "https://example.com/tomatoes.jpg",
    "specifications": {
      "origin": "Local Farm",
      "organic": true,
      "grade": "A"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Item created successfully",
  "item": {
    "id": 1,
    "name": "Organic Tomatoes",
    "description": "Fresh organic tomatoes from local farm",
    "price": 299.99,
    "category": "Vegetables",
    "quantity": 100,
    "status": "active",
    "created_at": "2026-02-13T18:00:00.000Z"
  }
}
```

---

## 6. List Items

### 6.1 Get All Items (Public)

```bash
curl https://api.zentrip.social/items
```

**Expected Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Organic Tomatoes",
      "description": "Fresh organic tomatoes from local farm",
      "price": 299.99,
      "category": "Vegetables",
      "quantity": 100,
      "status": "active"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### 6.2 Get Single Item

```bash
curl https://api.zentrip.social/items/1
```

### 6.3 Search Items by Category

```bash
curl "https://api.zentrip.social/items?category=Vegetables"
```

### 6.4 Filter by Price Range

```bash
curl "https://api.zentrip.social/items?min_price=100&max_price=500"
```

---

## 7. Create Order

### 7.1 Create Fixed Price Order (Buyer)

```bash
curl -X POST https://api.zentrip.social/orders \
  -H "Authorization: Bearer BUYER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "quantity": 10,
    "order_type": "fixed_price",
    "shipping_address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    },
    "notes": "Please deliver before Friday"
  }'
```

**Expected Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": 1,
    "item_id": 1,
    "buyer_id": 1,
    "quantity": 10,
    "total_price": 2999.90,
    "order_type": "fixed_price",
    "status": "pending",
    "created_at": "2026-02-13T18:00:00.000Z"
  }
}
```

### 7.2 Create Bid Request Order (Buyer)

```bash
curl -X POST https://api.zentrip.social/orders \
  -H "Authorization: Bearer BUYER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "quantity": 50,
    "order_type": "bid_request",
    "target_price": 250.00,
    "bid_deadline": "2026-02-20T23:59:59Z",
    "shipping_address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "USA"
    }
  }'
```

---

## 8. List Orders

### 8.1 Get My Orders (Buyer)

```bash
curl https://api.zentrip.social/orders/my-orders \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

### 8.2 Get All Orders (Admin)

```bash
curl https://api.zentrip.social/orders \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### 8.3 Get Single Order

```bash
curl https://api.zentrip.social/orders/1 \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

### 8.4 Filter Orders by Status

```bash
curl "https://api.zentrip.social/orders/my-orders?status=pending" \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

---

## 9. Create Bid

### 9.1 Seller Places Bid on Order

```bash
curl -X POST https://api.zentrip.social/bids \
  -H "Authorization: Bearer SELLER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "bid_amount": 275.00,
    "delivery_date": "2026-02-25",
    "message": "We can deliver high-quality tomatoes at this price"
  }'
```

**Expected Response:**
```json
{
  "message": "Bid created successfully",
  "bid": {
    "id": 1,
    "order_id": 1,
    "seller_id": 2,
    "bid_amount": 275.00,
    "delivery_date": "2026-02-25",
    "status": "pending",
    "created_at": "2026-02-13T18:00:00.000Z"
  }
}
```

### 9.2 Shipping Provider Places Shipping Bid

```bash
curl -X POST https://api.zentrip.social/shipping-bids \
  -H "Authorization: Bearer SHIPPER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "shipping_cost": 150.00,
    "estimated_delivery": "2026-02-28",
    "shipping_method": "Express",
    "message": "Fast and reliable delivery"
  }'
```

---

## 10. List Bids

### 10.1 Get Bids for an Order (Buyer)

```bash
curl https://api.zentrip.social/orders/1/bids \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

### 10.2 Get My Bids (Seller)

```bash
curl https://api.zentrip.social/bids/my-bids \
  -H "Authorization: Bearer SELLER_TOKEN_HERE"
```

### 10.3 Accept a Bid (Buyer)

```bash
curl -X PUT https://api.zentrip.social/bids/1/accept \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "message": "Bid accepted successfully",
  "bid": {
    "id": 1,
    "status": "accepted",
    "updated_at": "2026-02-13T18:00:00.000Z"
  }
}
```

### 10.4 Reject a Bid (Buyer)

```bash
curl -X PUT https://api.zentrip.social/bids/1/reject \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

---

## 11. RFQ (Request for Quotation)

### 11.1 Create RFQ (Buyer)

```bash
curl -X POST https://api.zentrip.social/rfqs \
  -H "Authorization: Bearer BUYER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Bulk Vegetable Purchase",
    "description": "Looking for 500kg of mixed vegetables",
    "deadline": "2026-03-01T23:59:59Z",
    "requirements": {
      "quantity": 500,
      "quality": "Grade A",
      "organic": true
    }
  }'
```

### 11.2 List RFQs

```bash
curl https://api.zentrip.social/rfqs \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

### 11.3 Invite Supplier to RFQ

```bash
curl -X POST https://api.zentrip.social/rfqs/1/invite \
  -H "Authorization: Bearer BUYER_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "supplier_email": "supplier@example.com",
    "message": "We would like you to quote for this RFQ"
  }'
```

---

## 12. Market Prices

### 12.1 Get Market Prices

```bash
curl https://api.zentrip.social/market-prices
```

### 12.2 Add Market Price (Admin)

```bash
curl -X POST https://api.zentrip.social/market-prices \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Tomatoes",
    "price": 280.00,
    "unit": "kg",
    "market": "Local Market",
    "date": "2026-02-13"
  }'
```

---

## 13. User Management (Admin)

### 13.1 List All Users

```bash
curl https://api.zentrip.social/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### 13.2 Get User by ID

```bash
curl https://api.zentrip.social/users/1 \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

### 13.3 Update User

```bash
curl -X PUT https://api.zentrip.social/users/1 \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "company_name": "Updated Company"
  }'
```

### 13.4 Delete User

```bash
curl -X DELETE https://api.zentrip.social/users/1 \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## 14. Statistics & Analytics

### 14.1 Buyer Dashboard Stats

```bash
curl https://api.zentrip.social/stats/buyer \
  -H "Authorization: Bearer BUYER_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "total_orders": 5,
  "pending_orders": 2,
  "completed_orders": 3,
  "total_spent": 15000.00,
  "active_bids": 8
}
```

### 14.2 Seller Dashboard Stats

```bash
curl https://api.zentrip.social/stats/seller \
  -H "Authorization: Bearer SELLER_TOKEN_HERE"
```

### 14.3 Admin Dashboard Stats

```bash
curl https://api.zentrip.social/stats/admin \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"
```

---

## 15. Refresh Token

### 15.1 Refresh Access Token

```bash
curl -X POST https://api.zentrip.social/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Expected Response:**
```json
{
  "token": "new_access_token_here",
  "refreshToken": "new_refresh_token_here"
}
```

---

## 🧪 Complete Test Script (Bash)

Save this as `test-api.sh`:

```bash
#!/bin/bash

BASE_URL="https://api.zentrip.social"

echo "=== Testing API: $BASE_URL ==="
echo ""

# 1. Health Check
echo "1. Health Check..."
curl -s $BASE_URL/health | jq
echo ""

# 2. Signup
echo "2. Creating buyer account..."
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testbuyer@example.com",
    "password": "Test123!",
    "name": "Test Buyer",
    "role": "buyer"
  }')
echo $SIGNUP_RESPONSE | jq
TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')
echo "Token: $TOKEN"
echo ""

# 3. Login
echo "3. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testbuyer@example.com",
    "password": "Test123!"
  }')
echo $LOGIN_RESPONSE | jq
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
echo ""

# 4. Get Profile
echo "4. Getting user profile..."
curl -s $BASE_URL/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# 5. List Items
echo "5. Listing items..."
curl -s $BASE_URL/items | jq
echo ""

echo "=== Tests Complete ==="
```

**Run the script:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔍 Testing Tips

### Use jq for Pretty JSON
```bash
# Install jq (JSON processor)
# Ubuntu/Debian: sudo apt install jq
# Mac: brew install jq
# Windows: choco install jq

# Use with curl
curl https://api.zentrip.social/health | jq
```

### Save Response to File
```bash
curl https://api.zentrip.social/items > items.json
```

### Show Response Headers
```bash
curl -i https://api.zentrip.social/health
```

### Verbose Output (Debug)
```bash
curl -v https://api.zentrip.social/health
```

### Test with Different HTTP Methods
```bash
# GET (default)
curl https://api.zentrip.social/items

# POST
curl -X POST https://api.zentrip.social/auth/login

# PUT
curl -X PUT https://api.zentrip.social/items/1

# DELETE
curl -X DELETE https://api.zentrip.social/items/1
```

---

## 📊 Expected HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 500 | Server Error | Internal server error |

---

## 🆘 Troubleshooting

### Error: Connection Refused
```bash
# Check if API is running
curl https://api.zentrip.social/health
```

### Error: SSL Certificate Problem
```bash
# Skip SSL verification (testing only!)
curl -k https://api.zentrip.social/health
```

### Error: 401 Unauthorized
```bash
# Check if token is valid
echo $TOKEN

# Try logging in again to get fresh token
```

### Error: CORS
CORS errors only appear in browsers, not curl. If testing from browser:
- Check backend CORS_ORIGIN setting
- Ensure frontend URL is allowed

---

**Happy Testing! 🚀**

All endpoints are now ready to test at `https://api.zentrip.social`
