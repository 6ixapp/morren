# Morren Backend API Guide

Complete guide for all backend endpoints with authentication and permissions.

## Table of Contents
- [Authentication](#authentication)
- [Orders Flow](#orders-flow)
- [Bids Flow](#bids-flow)
- [User Roles & Permissions](#user-roles--permissions)
- [API Endpoints](#api-endpoints)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Get Token (Login)
```http
POST /auth/login
Content-Type: application/json

{
  "email": "buyer1@test.com",
  "password": "password123"
}
```

Response:
```json
{
  "user": {
    "id": "uuid",
    "name": "John Buyer",
    "email": "buyer1@test.com",
    "role": "buyer"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## Orders Flow

### 1. Buyer Places Order

**Endpoint:** `POST /api/orders`
**Auth:** Required (buyer or admin)
**Description:** Buyer creates a new order for an item

```http
POST /api/orders
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "itemId": "66666666-6666-6666-6666-666666666661",
  "buyerId": "22222222-2222-2222-2222-222222222222",
  "quantity": 50,
  "totalPrice": 7500.00,
  "shippingAddress": "456 Buyer Ave, City, Country",
  "notes": "Need delivery by next week"
}
```

Response:
```json
{
  "id": "77777777-7777-7777-7777-777777777771",
  "itemId": "66666666-6666-6666-6666-666666666661",
  "buyerId": "22222222-2222-2222-2222-222222222222",
  "quantity": 50,
  "totalPrice": "7500.00",
  "status": "pending",
  "shippingAddress": "456 Buyer Ave, City, Country",
  "notes": "Need delivery by next week",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. Seller Views Pending Orders

**Endpoint:** `GET /api/orders/seller/:sellerId`
**Auth:** Required
**Description:** Sellers see all pending orders they can bid on

```http
GET /api/orders/seller/33333333-3333-3333-3333-333333333333
Authorization: Bearer <seller_token>
```

Response:
```json
[
  {
    "id": "77777777-7777-7777-7777-777777777771",
    "itemId": "66666666-6666-6666-6666-666666666661",
    "buyerId": "22222222-2222-2222-2222-222222222222",
    "quantity": 50,
    "totalPrice": "7500.00",
    "status": "pending",
    "shippingAddress": "456 Buyer Ave, City, Country",
    "notes": "Need delivery by next week",
    "createdAt": "2024-01-15T10:30:00Z",
    "item": {
      "id": "66666666-6666-6666-6666-666666666661",
      "name": "Premium Steel Pipes",
      "description": "High-quality steel pipes",
      "image": "https://example.com/steel-pipes.jpg",
      "price": "150.00",
      "category": "Construction Materials"
    },
    "buyer": {
      "id": "22222222-2222-2222-2222-222222222222",
      "name": "John Buyer",
      "email": "buyer1@test.com"
    }
  }
]
```

### 3. Buyer Views Their Orders

**Endpoint:** `GET /api/orders/buyer/:buyerId`
**Auth:** Required
**Description:** Buyers see all their orders with current status

```http
GET /api/orders/buyer/22222222-2222-2222-2222-222222222222
Authorization: Bearer <buyer_token>
```

---

## Bids Flow

### 1. Seller Places Bid

**Endpoint:** `POST /api/bids`
**Auth:** Required (seller or admin)
**Description:** Seller submits a bid on a pending order

```http
POST /api/bids
Authorization: Bearer <seller_token>
Content-Type: application/json

{
  "orderId": "77777777-7777-7777-7777-777777777771",
  "sellerId": "33333333-3333-3333-3333-333333333333",
  "bidAmount": 7200.00,
  "estimatedDelivery": "2024-02-15",
  "message": "Can deliver within 5 days with premium quality",
  "pickupAddress": "321 Seller St, City, Country"
}
```

Response:
```json
{
  "id": "88888888-8888-8888-8888-888888888881",
  "orderId": "77777777-7777-7777-7777-777777777771",
  "sellerId": "33333333-3333-3333-3333-333333333333",
  "bidAmount": "7200.00",
  "estimatedDelivery": "2024-02-15",
  "message": "Can deliver within 5 days with premium quality",
  "pickupAddress": "321 Seller St, City, Country",
  "status": "pending",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

### 2. Buyer Views Bids on Their Order

**Endpoint:** `GET /api/bids/order/:orderId`
**Auth:** Required
**Description:** Buyers see all bids submitted for their order

```http
GET /api/bids/order/77777777-7777-7777-7777-777777777771
Authorization: Bearer <buyer_token>
```

Response:
```json
[
  {
    "id": "88888888-8888-8888-8888-888888888881",
    "orderId": "77777777-7777-7777-7777-777777777771",
    "sellerId": "33333333-3333-3333-3333-333333333333",
    "bidAmount": "7200.00",
    "estimatedDelivery": "2024-02-15",
    "message": "Can deliver within 5 days with premium quality",
    "pickupAddress": "321 Seller St, City, Country",
    "status": "pending",
    "createdAt": "2024-01-15T11:00:00Z",
    "seller": {
      "id": "33333333-3333-3333-3333-333333333333",
      "name": "Bob Seller",
      "email": "seller1@test.com"
    }
  },
  {
    "id": "88888888-8888-8888-8888-888888888882",
    "orderId": "77777777-7777-7777-7777-777777777771",
    "sellerId": "33333333-3333-3333-3333-333333333334",
    "bidAmount": "7000.00",
    "estimatedDelivery": "2024-02-20",
    "message": "Best price guarantee",
    "pickupAddress": "654 Seller Ave, City, Country",
    "status": "pending",
    "createdAt": "2024-01-15T11:15:00Z",
    "seller": {
      "id": "33333333-3333-3333-3333-333333333334",
      "name": "Alice Seller",
      "email": "seller2@test.com"
    }
  }
]
```

### 3. Seller Views Their Bids

**Endpoint:** `GET /api/bids/seller/:sellerId`
**Auth:** Required
**Description:** Sellers see all bids they have submitted

```http
GET /api/bids/seller/33333333-3333-3333-3333-333333333333
Authorization: Bearer <seller_token>
```

### 4. Buyer Accepts a Bid

**Endpoint:** `PATCH /api/bids/:id`
**Auth:** Required
**Description:** Buyer accepts a bid, typically also updates order status

```http
PATCH /api/bids/88888888-8888-8888-8888-888888888881
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "status": "accepted"
}
```

Then update the order:
```http
PATCH /api/orders/77777777-7777-7777-7777-777777777771
Authorization: Bearer <buyer_token>
Content-Type: application/json

{
  "status": "accepted"
}
```

---

## User Roles & Permissions

### Buyer
- ✅ Create orders (`POST /api/orders`)
- ✅ View their orders (`GET /api/orders/buyer/:buyerId`)
- ✅ View bids on their orders (`GET /api/bids/order/:orderId`)
- ✅ Accept/reject bids (`PATCH /api/bids/:id`)
- ✅ Update their orders (`PATCH /api/orders/:id`)
- ✅ Delete their orders (`DELETE /api/orders/:id`)
- ✅ Create RFQs
- ❌ Cannot place bids
- ❌ Cannot see all orders

### Seller
- ✅ View pending orders to bid on (`GET /api/orders/seller/:sellerId`)
- ✅ Place bids (`POST /api/bids`)
- ✅ View their bids (`GET /api/bids/seller/:sellerId`)
- ✅ Update their bids (`PATCH /api/bids/:id`)
- ✅ Delete their bids (`DELETE /api/bids/:id`)
- ✅ Create/manage items
- ❌ Cannot create orders
- ❌ Cannot see all orders

### Shipping Provider
- ✅ View accepted orders (`GET /api/orders/shipping`)
- ✅ Place shipping bids (`POST /api/shipping-bids`)
- ✅ View their shipping bids
- ❌ Cannot create orders
- ❌ Cannot place seller bids

### Admin
- ✅ Full access to all endpoints
- ✅ View all orders (`GET /api/orders`)
- ✅ View all bids (`GET /api/bids`)
- ✅ Create/update/delete anything

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | No | - | Register new user |
| POST | `/auth/login` | No | - | Login and get tokens |
| POST | `/auth/refresh` | No | - | Refresh access token |
| GET | `/auth/me` | Yes | All | Get current user |
| POST | `/auth/logout` | Yes | All | Logout user |

### Orders
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/orders` | Yes | Admin | Get all orders |
| GET | `/api/orders/:id` | Yes | All | Get order by ID |
| GET | `/api/orders/buyer/:buyerId` | Yes | All | Get buyer's orders |
| GET | `/api/orders/seller/:sellerId` | Yes | All | Get pending orders (for bidding) |
| GET | `/api/orders/seller/:sellerId/items` | Yes | All | Get orders for seller's items |
| GET | `/api/orders/shipping` | Yes | Shipping/Admin | Get accepted orders |
| POST | `/api/orders` | Yes | Buyer/Admin | Create new order |
| PATCH | `/api/orders/:id` | Yes | All | Update order |
| DELETE | `/api/orders/:id` | Yes | Admin/Buyer | Delete order |

### Bids
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/bids` | Yes | Admin | Get all bids |
| GET | `/api/bids/:id` | Yes | All | Get bid by ID |
| GET | `/api/bids/order/:orderId` | Yes | All | Get bids for order |
| GET | `/api/bids/seller/:sellerId` | Yes | All | Get seller's bids |
| POST | `/api/bids` | Yes | Seller/Admin | Create new bid |
| PATCH | `/api/bids/:id` | Yes | All | Update bid |
| DELETE | `/api/bids/:id` | Yes | Seller/Admin | Delete bid |

### Items
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/items` | No | - | Get all active items |
| GET | `/api/items/:id` | No | - | Get item by ID |
| GET | `/api/items/seller/:sellerId` | Yes | All | Get seller's items |
| POST | `/api/items` | Yes | Seller/Admin | Create new item |
| PATCH | `/api/items/:id` | Yes | Seller/Admin | Update item |
| DELETE | `/api/items/:id` | Yes | Seller/Admin | Delete item |

### Shipping Bids
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/shipping-bids` | Yes | Admin | Get all shipping bids |
| GET | `/api/shipping-bids/:id` | Yes | All | Get shipping bid by ID |
| GET | `/api/shipping-bids/order/:orderId` | Yes | All | Get shipping bids for order |
| GET | `/api/shipping-bids/provider/:providerId` | Yes | All | Get provider's bids |
| POST | `/api/shipping-bids` | Yes | Shipping/Admin | Create shipping bid |
| PATCH | `/api/shipping-bids/:id` | Yes | All | Update shipping bid |
| DELETE | `/api/shipping-bids/:id` | Yes | Shipping/Admin | Delete shipping bid |

---

## Quick Test Commands

### 1. Login as Buyer
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer1@test.com","password":"password123"}'
```

### 2. Create Order (use token from login)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "66666666-6666-6666-6666-666666666661",
    "buyerId": "22222222-2222-2222-2222-222222222222",
    "quantity": 10,
    "totalPrice": 1500.00,
    "shippingAddress": "123 Test St"
  }'
```

### 3. Login as Seller
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"seller1@test.com","password":"password123"}'
```

### 4. View Pending Orders
```bash
curl -X GET "http://localhost:5000/api/orders/seller/33333333-3333-3333-3333-333333333333" \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN"
```

### 5. Place Bid
```bash
curl -X POST http://localhost:5000/api/bids \
  -H "Authorization: Bearer YOUR_SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID_FROM_STEP_2",
    "sellerId": "33333333-3333-3333-3333-333333333333",
    "bidAmount": 1400.00,
    "estimatedDelivery": "2024-02-15",
    "message": "Fast delivery available"
  }'
```

### 6. View Bids (as Buyer)
```bash
curl -X GET "http://localhost:5000/api/bids/order/ORDER_ID" \
  -H "Authorization: Bearer YOUR_BUYER_TOKEN"
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": ["Field 'quantity' is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Database Permissions

The database is set up with proper foreign key constraints:

1. **Orders** require valid `item_id` and `buyer_id`
2. **Bids** require valid `order_id` and `seller_id`
3. **Shipping Bids** require valid `order_id` and `shipping_provider_id`
4. Cascade deletes ensure data integrity

All tables have proper indexes for optimal query performance.

---

## Support

For issues or questions:
1. Check this API guide
2. Review the `BACKEND_README.md`
3. Check database schema in `src/db/schema.sql`
4. Review seed data in `src/db/seed.sql`
