# Mobile App API Documentation
## React Native Expo - Backend API Endpoints

**Base URL:** `http://your-server:5000` (Update with your actual backend URL)

**Last Updated:** 2026-01-31

---

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Items](#items)
- [Orders](#orders)
- [Bids](#bids)
- [RFQ (Request for Quote)](#rfq-request-for-quote)
- [Shipping Bids](#shipping-bids)
- [Suppliers](#suppliers)
- [Statistics](#statistics)
- [Market Prices](#market-prices)
- [Buyer Profile](#buyer-profile)
- [Common Response Codes](#common-response-codes)
- [Authentication Flow](#authentication-flow)

---

## Legend
- 🔓 **Public** - No authentication required
- 🔒 **Auth Required** - Must include JWT token in Authorization header
- 👤 **Role Required** - Specific user role needed
- ✅ **Safe (Read-Only)** - GET requests that don't modify data
- ⚠️ **Modifies Data** - POST/PATCH/DELETE requests

---

## Authentication

### Register User
```
POST /auth/register
```
🔓 Public | ⚠️ Modifies Data

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "buyer"
}
```
**Roles:** `buyer`, `seller`, `shipping_provider`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "buyer"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Login User
```
POST /auth/login
```
🔓 Public | ⚠️ Modifies Data

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "buyer"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Refresh Access Token
```
POST /auth/refresh
```
🔓 Public | ⚠️ Modifies Data

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Get Current User Profile
```
GET /auth/me
```
🔒 Auth Required | ✅ Safe

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "buyer",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### Logout User
```
POST /auth/logout
```
🔒 Auth Required | ⚠️ Modifies Data

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Users

### Get All Users
```
GET /api/users
```
🔒 Auth Required | 👤 Admin Only | ✅ Safe

---

### Get User by ID
```
GET /api/users/:id
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/users/1`

---

### Update User
```
PATCH /api/users/:id
```
🔒 Auth Required | ⚠️ Modifies Data

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

---

## Items

### Get All Items
```
GET /api/items
```
🔓 Public | ✅ Safe

**Query Parameters:**
- `category` (optional)
- `search` (optional)
- `limit` (optional)
- `offset` (optional)

**Example:** `GET /api/items?category=electronics&limit=20`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "description": "High-performance laptop",
    "category": "electronics",
    "price": 1200.00,
    "quantity": 50,
    "unit": "pieces",
    "sellerId": 2,
    "status": "active",
    "createdAt": "2026-01-15T10:30:00Z"
  }
]
```

---

### Get Active Items Only
```
GET /api/items/active
```
🔓 Public | ✅ Safe

Returns only items with `status: 'active'`

---

### Get Item by ID
```
GET /api/items/:id
```
🔓 Public | ✅ Safe

**Example:** `GET /api/items/1`

---

### Create Item
```
POST /api/items
```
🔒 Auth Required | 👤 Seller/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "category": "category_name",
  "price": 100.00,
  "quantity": 50,
  "unit": "kg",
  "status": "active"
}
```

---

### Update Item
```
PATCH /api/items/:id
```
🔒 Auth Required | 👤 Seller/Admin | ⚠️ Modifies Data

---

### Delete Item
```
DELETE /api/items/:id
```
🔒 Auth Required | 👤 Seller/Admin | ⚠️ Modifies Data

---

## Orders

### Get All Orders
```
GET /api/orders
```
🔒 Auth Required | 👤 Admin Only | ✅ Safe

---

### Get Orders for Shipping
```
GET /api/orders/shipping
```
🔒 Auth Required | 👤 Shipping Provider/Admin | ✅ Safe

Returns orders available for shipping bids.

---

### Get Orders by Buyer
```
GET /api/orders/buyer/:buyerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/orders/buyer/1`

Returns all orders created by a specific buyer.

---

### Get Orders by Seller
```
GET /api/orders/seller/:sellerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/orders/seller/2`

Returns all orders where seller has items.

---

### Get Seller's Item Orders
```
GET /api/orders/seller/:sellerId/items
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/orders/seller/2/items`

Returns detailed view of items in orders for a seller.

---

### Get Order by ID
```
GET /api/orders/:id
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/orders/1`

**Response:**
```json
{
  "id": 1,
  "buyerId": 1,
  "totalAmount": 1500.00,
  "status": "pending",
  "deliveryAddress": "123 Main St, City",
  "deliveryDate": "2026-02-01",
  "items": [
    {
      "itemId": 1,
      "quantity": 2,
      "price": 750.00
    }
  ],
  "createdAt": "2026-01-20T10:30:00Z"
}
```

---

### Create Order
```
POST /api/orders
```
🔒 Auth Required | 👤 Buyer/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "items": [
    {
      "itemId": 1,
      "quantity": 2,
      "price": 750.00
    }
  ],
  "deliveryAddress": "123 Main St, City",
  "deliveryDate": "2026-02-01",
  "notes": "Please deliver in the morning"
}
```

---

### Update Order
```
PATCH /api/orders/:id
```
🔒 Auth Required | ⚠️ Modifies Data

**Request Body:**
```json
{
  "status": "confirmed",
  "deliveryAddress": "Updated address"
}
```

**Possible Status Values:**
- `pending`
- `confirmed`
- `shipped`
- `delivered`
- `cancelled`

---

### Delete Order
```
DELETE /api/orders/:id
```
🔒 Auth Required | 👤 Admin/Buyer | ⚠️ Modifies Data

---

## Bids

### Get All Bids
```
GET /api/bids
```
🔒 Auth Required | 👤 Admin Only | ✅ Safe

---

### Get Bids by Order
```
GET /api/bids/order/:orderId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/bids/order/1`

Returns all bids submitted for a specific order.

---

### Get Bids by Seller
```
GET /api/bids/seller/:sellerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/bids/seller/2`

Returns all bids created by a specific seller.

---

### Get Bid by ID
```
GET /api/bids/:id
```
🔒 Auth Required | ✅ Safe

---

### Create Bid
```
POST /api/bids
```
🔒 Auth Required | 👤 Seller/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "orderId": 1,
  "amount": 1450.00,
  "deliveryDate": "2026-01-30",
  "notes": "Can deliver earlier if needed"
}
```

---

### Update Bid
```
PATCH /api/bids/:id
```
🔒 Auth Required | ⚠️ Modifies Data

**Request Body:**
```json
{
  "amount": 1400.00,
  "status": "accepted"
}
```

**Possible Status Values:**
- `pending`
- `accepted`
- `rejected`
- `withdrawn`

---

### Delete Bid
```
DELETE /api/bids/:id
```
🔒 Auth Required | 👤 Seller/Admin | ⚠️ Modifies Data

---

## RFQ (Request for Quote)

### Get All RFQs
```
GET /api/rfqs
```
🔒 Auth Required | ✅ Safe

**Query Parameters:**
- `buyerId` (optional) - Filter by buyer

**Example:** `GET /api/rfqs?buyerId=1`

---

### Get RFQ by ID
```
GET /api/rfqs/:id
```
🔒 Auth Required | ✅ Safe

**Response:**
```json
{
  "id": 1,
  "buyerId": 1,
  "title": "Office Supplies Request",
  "description": "Need 100 units of paper",
  "deadline": "2026-02-15",
  "status": "open",
  "items": [
    {
      "name": "A4 Paper",
      "quantity": 100,
      "unit": "reams"
    }
  ],
  "createdAt": "2026-01-20T10:30:00Z"
}
```

---

### Get RFQ by Invite Token (Supplier View)
```
GET /api/rfqs/by-invite/:token
```
🔓 Public | ✅ Safe

**Example:** `GET /api/rfqs/by-invite/abc123xyz`

Allows suppliers to view RFQ details via invite link without authentication.

---

### Create RFQ
```
POST /api/rfqs
```
🔒 Auth Required | 👤 Buyer/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "title": "Office Supplies Request",
  "description": "Need office supplies for new branch",
  "deadline": "2026-02-15",
  "items": [
    {
      "name": "A4 Paper",
      "quantity": 100,
      "unit": "reams",
      "specifications": "White, 80gsm"
    }
  ]
}
```

---

### Update RFQ
```
PATCH /api/rfqs/:id
```
🔒 Auth Required | 👤 Buyer/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "status": "closed",
  "deadline": "2026-02-20"
}
```

**Possible Status Values:**
- `open`
- `closed`
- `awarded`
- `cancelled`

---

### Add Supplier Invite to RFQ
```
POST /api/rfqs/:id/invites
```
🔒 Auth Required | 👤 Buyer/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "supplierId": 5,
  "message": "We would like your quote for this RFQ"
}
```

Generates a unique invite token for the supplier.

---

### Mark Invite as Viewed
```
PATCH /api/rfqs/invites/viewed
```
🔓 Public | ⚠️ Modifies Data

**Request Body:**
```json
{
  "token": "abc123xyz"
}
```

Supplier marks the RFQ invite as viewed (used when accessing via invite link).

---

### Submit Quote for RFQ
```
POST /api/rfqs/:id/quote
```
🔓 Public | ⚠️ Modifies Data

**Request Body:**
```json
{
  "inviteToken": "abc123xyz",
  "amount": 5000.00,
  "notes": "Can deliver within 2 weeks",
  "items": [
    {
      "rfqItemId": 1,
      "unitPrice": 50.00,
      "totalPrice": 5000.00
    }
  ]
}
```

Supplier submits a quote for an RFQ (via invite token).

---

### Award RFQ to Supplier
```
POST /api/rfqs/:id/award
```
🔒 Auth Required | 👤 Buyer/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "quoteId": 1
}
```

Buyer awards the RFQ to a supplier's quote.

---

## Shipping Bids

### Get All Shipping Bids
```
GET /api/shipping-bids
```
🔒 Auth Required | 👤 Admin Only | ✅ Safe

---

### Get Shipping Bids by Order
```
GET /api/shipping-bids/order/:orderId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/shipping-bids/order/1`

Returns all shipping bids for a specific order.

---

### Get Shipping Bids by Provider
```
GET /api/shipping-bids/provider/:providerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/shipping-bids/provider/3`

Returns all bids created by a specific shipping provider.

---

### Get Shipping Bid by ID
```
GET /api/shipping-bids/:id
```
🔒 Auth Required | ✅ Safe

---

### Create Shipping Bid
```
POST /api/shipping-bids
```
🔒 Auth Required | 👤 Shipping Provider/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "orderId": 1,
  "amount": 50.00,
  "estimatedDeliveryDate": "2026-02-05",
  "notes": "Express delivery available"
}
```

---

### Update Shipping Bid
```
PATCH /api/shipping-bids/:id
```
🔒 Auth Required | ⚠️ Modifies Data

**Request Body:**
```json
{
  "amount": 45.00,
  "status": "accepted"
}
```

**Possible Status Values:**
- `pending`
- `accepted`
- `rejected`
- `withdrawn`

---

### Delete Shipping Bid
```
DELETE /api/shipping-bids/:id
```
🔒 Auth Required | 👤 Shipping Provider/Admin | ⚠️ Modifies Data

---

## Suppliers

### Get All Suppliers
```
GET /api/suppliers
```
🔒 Auth Required | ✅ Safe

**Response:**
```json
[
  {
    "id": 1,
    "name": "ABC Suppliers Ltd",
    "email": "contact@abcsuppliers.com",
    "phone": "+1234567890",
    "address": "123 Supply St, City",
    "category": "electronics",
    "rating": 4.5,
    "createdAt": "2026-01-10T10:30:00Z"
  }
]
```

---

### Get Supplier by ID
```
GET /api/suppliers/:id
```
🔒 Auth Required | ✅ Safe

---

### Create Supplier
```
POST /api/suppliers
```
🔒 Auth Required | 👤 Admin/Buyer | ⚠️ Modifies Data

**Request Body:**
```json
{
  "name": "New Supplier Co",
  "email": "info@newsupplier.com",
  "phone": "+1234567890",
  "address": "456 Business Ave, City",
  "category": "office_supplies"
}
```

---

### Update Supplier
```
PATCH /api/suppliers/:id
```
🔒 Auth Required | 👤 Admin/Buyer | ⚠️ Modifies Data

---

### Delete Supplier
```
DELETE /api/suppliers/:id
```
🔒 Auth Required | 👤 Admin Only | ⚠️ Modifies Data

---

## Statistics

### Get Buyer Statistics
```
GET /api/stats/buyer/:buyerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/stats/buyer/1`

**Response:**
```json
{
  "totalOrders": 25,
  "totalSpent": 15000.00,
  "pendingOrders": 3,
  "completedOrders": 20,
  "cancelledOrders": 2,
  "activeRFQs": 2,
  "averageOrderValue": 600.00
}
```

---

### Get Seller Statistics
```
GET /api/stats/seller/:sellerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/stats/seller/2`

**Response:**
```json
{
  "totalSales": 50000.00,
  "totalOrders": 40,
  "pendingBids": 5,
  "acceptedBids": 30,
  "totalItems": 15,
  "activeItems": 12,
  "averageBidValue": 1250.00
}
```

---

### Get Admin Statistics
```
GET /api/stats/admin
```
🔒 Auth Required | 👤 Admin Only | ✅ Safe

**Response:**
```json
{
  "totalUsers": 150,
  "totalBuyers": 100,
  "totalSellers": 40,
  "totalShippingProviders": 10,
  "totalOrders": 500,
  "totalRevenue": 250000.00,
  "activeRFQs": 20,
  "totalItems": 200
}
```

---

## Market Prices

### Get Market Prices
```
GET /api/market-prices
```
🔓 Public | ✅ Safe

**Query Parameters:**
- `category` (optional)
- `item` (optional)

**Example:** `GET /api/market-prices?category=agriculture`

**Response:**
```json
[
  {
    "id": 1,
    "category": "agriculture",
    "item": "Wheat",
    "price": 250.00,
    "unit": "kg",
    "date": "2026-01-31",
    "source": "Market Board"
  }
]
```

---

### Add Market Price
```
POST /api/market-prices
```
🔒 Auth Required | 👤 Admin/Buyer | ⚠️ Modifies Data

**Request Body:**
```json
{
  "category": "agriculture",
  "item": "Wheat",
  "price": 250.00,
  "unit": "kg",
  "source": "Market Board"
}
```

---

### Delete Market Price
```
DELETE /api/market-prices/:id
```
🔒 Auth Required | 👤 Admin Only | ⚠️ Modifies Data

---

## Buyer Profile

### Get Buyer Profile
```
GET /api/buyer-profiles/:buyerId
```
🔒 Auth Required | ✅ Safe

**Example:** `GET /api/buyer-profiles/1`

**Response:**
```json
{
  "buyerId": 1,
  "companyName": "ABC Corp",
  "businessType": "retail",
  "taxId": "123456789",
  "shippingAddress": "123 Main St, City",
  "billingAddress": "123 Main St, City",
  "preferredPaymentMethod": "bank_transfer",
  "creditLimit": 50000.00
}
```

---

### Update Buyer Profile
```
PUT /api/buyer-profiles/:buyerId
```
🔒 Auth Required | 👤 Buyer/Admin | ⚠️ Modifies Data

**Request Body:**
```json
{
  "companyName": "ABC Corporation",
  "businessType": "wholesale",
  "shippingAddress": "Updated address",
  "preferredPaymentMethod": "credit_card"
}
```

---

## Common Response Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or token invalid |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate email) |
| 500 | Internal Server Error | Server error |

---

## Authentication Flow

### Initial Login/Registration
1. **Register** or **Login** using `/auth/register` or `/auth/login`
2. Store the `accessToken` and `refreshToken` securely (use SecureStore in Expo)
3. Include `Authorization: Bearer <accessToken>` header in all authenticated requests

### Token Refresh
1. When `accessToken` expires (401 error), use `/auth/refresh` with `refreshToken`
2. Update stored `accessToken` with the new one
3. Retry the original request

### Logout
1. Call `/auth/logout` to invalidate the refresh token
2. Clear stored tokens from SecureStore

---

## Example Mobile App Implementation (Axios)

```javascript
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://your-server:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        await SecureStore.setItemAsync('accessToken', data.accessToken);
        await SecureStore.setItemAsync('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## Safe Endpoints for Mobile App (Read-Only)

These endpoints are safe to use and won't modify your database:

### Public (No Auth)
- `GET /api/items` - Browse items
- `GET /api/items/active` - Browse active items
- `GET /api/items/:id` - View item details
- `GET /api/market-prices` - View market prices
- `GET /api/rfqs/by-invite/:token` - View RFQ via invite

### Authenticated (Read-Only)
- `GET /auth/me` - Get current user
- `GET /api/users/:id` - Get user info
- `GET /api/orders/buyer/:buyerId` - View your orders
- `GET /api/orders/seller/:sellerId` - View orders with your items
- `GET /api/orders/:id` - View order details
- `GET /api/bids/order/:orderId` - View bids on order
- `GET /api/bids/seller/:sellerId` - View your bids
- `GET /api/rfqs` - View RFQs
- `GET /api/rfqs/:id` - View RFQ details
- `GET /api/shipping-bids/order/:orderId` - View shipping bids
- `GET /api/suppliers` - View suppliers
- `GET /api/suppliers/:id` - View supplier details
- `GET /api/stats/buyer/:buyerId` - View your stats
- `GET /api/stats/seller/:sellerId` - View your stats
- `GET /api/buyer-profiles/:buyerId` - View buyer profile

---

## Notes

1. **Base URL:** Update `API_BASE_URL` with your actual backend server URL
2. **Token Storage:** Always use SecureStore (Expo) or Keychain (React Native) for storing tokens
3. **Error Handling:** Implement proper error handling for network failures and API errors
4. **Loading States:** Show loading indicators during API calls
5. **Offline Support:** Consider implementing offline caching for frequently accessed data
6. **Rate Limiting:** Be mindful of rate limits (if implemented on backend)
7. **File Uploads:** If needed, use multipart/form-data for file uploads
8. **Pagination:** Use `limit` and `offset` query parameters for large datasets
9. **Real-time Updates:** Consider implementing WebSocket or polling for real-time notifications

---

## Support

For issues or questions, contact your backend development team.
