# Backend Changes Summary

## Changes Implemented

### 1. ✅ Token Expiration Fix - Extended Refresh Token Lifetime

**Files Modified:**
- `/.env.example` - Updated JWT configuration with better documentation

**Changes Made:**

#### Before:
```env
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

#### After:
```env
# Access Token: Short-lived for security (1-4 hours recommended)
JWT_EXPIRES_IN=4h

# Refresh Token: Long-lived for mobile app persistence (30 days recommended)
# This allows users to stay logged in for up to 30 days on mobile devices
# Mobile apps store tokens in encrypted hardware-backed storage
JWT_REFRESH_EXPIRES_IN=30d
```

**Impact:**
- Access tokens now last 4 hours (instead of 1 hour)
- Refresh tokens now last 30 days (instead of 7 days)
- **Mobile app users can stay logged in for up to 30 days** even after closing the app

**Action Required:**
Update your `.env` file with these new values:
```bash
JWT_EXPIRES_IN=4h
JWT_REFRESH_EXPIRES_IN=30d
```

Then restart the backend server:
```bash
npm run dev
```

---

### 2. ✅ Seller Public Profile Feature - New Endpoints

**New Files Created:**
1. `/src/controllers/sellerPublicController.ts` - Controller for seller public profiles
2. `/src/routes/sellerPublicRoutes.ts` - Routes for seller public API endpoints

**Files Modified:**
1. `/src/index.ts` - Added new routes to Express app
2. `/src/controllers/bidController.ts` - Added `anonymizedSellerId` field to bid responses

**New Endpoints:**

#### 1. GET `/api/sellers/:sellerId/public-profile`
Get public profile information for any seller.

**Access:** Any authenticated user

**Response:**
```json
{
  "sellerId": "uuid-here",
  "anonymizedId": "SLR-4f2a",
  "publicInfo": {
    "memberSince": "2025-01-15T00:00:00Z",
    "totalCompletedOrders": 23,
    "successRate": 85.2,
    "averageRating": null,
    "totalBidsPlaced": 47,
    "totalBidsAccepted": 23
  },
  "recentAcceptedOrders": [
    {
      "orderId": "uuid",
      "productName": "Turmeric",
      "quantity": 200,
      "unit": "kg",
      "bidAmount": 28000,
      "acceptedAt": "2026-02-10T00:00:00Z",
      "deliveryStatus": "delivered_on_time",
      "rating": null,
      "daysDelayed": null
    }
  ]
}
```

**Privacy Protected:**
- ❌ Seller name, email, phone, address are NOT exposed
- ✅ Only anonymized ID and statistics shown

#### 2. GET `/api/orders/:orderId/bidders`
Get list of sellers who placed bids on a specific order.

**Access:** Only the buyer who owns the order

**Response:**
```json
{
  "orderId": "uuid",
  "bidders": [
    {
      "sellerId": "uuid",
      "anonymizedId": "SLR-4f2a",
      "bidCount": 1,
      "bidAmount": 45000,
      "bidStatus": "pending",
      "bidCreatedAt": "2026-02-14T10:30:00Z"
    }
  ]
}
```

#### 3. Enhanced: All Bid Endpoints
All existing bid endpoints now include `anonymizedSellerId` field:

**Example - GET `/api/bids/order/:orderId`:**
```json
{
  "bids": [
    {
      "id": "bid_123",
      "sellerId": "seller_4f2a9c1b",
      "anonymizedSellerId": "SLR-4f2a",  // ← NEW
      "bidAmount": 45000,
      "status": "pending"
    }
  ]
}
```

---

## Database Schema Notes

### Current Schema (No Changes Required)
The current schema already supports this feature with existing tables:
- `users` - Seller information
- `bids` - Seller bids
- `orders` - Order information
- `items` - Product listings

### Future Enhancements (Optional)
To add ratings and delivery tracking, consider adding these fields to the `bids` table:

```sql
-- Optional: Add rating and delivery tracking to bids table
ALTER TABLE bids ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE bids ADD COLUMN delivery_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE bids ADD COLUMN days_delayed INTEGER DEFAULT 0;
ALTER TABLE bids ADD COLUMN delivered_at TIMESTAMP;
```

**Note:** The current implementation works without these fields. They're marked as `null` in responses and can be added later.

---

## Security Considerations

### ✅ Privacy Protection
- Seller personal information (name, email, phone, address) is NOT exposed
- Only anonymized IDs (e.g., "SLR-4f2a") are shown to buyers
- Full seller info only revealed after bid is accepted

### ✅ Access Control
- All endpoints require authentication
- `/api/orders/:orderId/bidders` endpoint checks that requester is the order owner
- Role-based access can be added using existing `authorize()` middleware if needed

### ✅ Token Security
- Refresh tokens stored securely in database (hashed in production recommended)
- 30-day lifetime balances security with user experience
- Mobile apps use hardware-backed encrypted storage

---

## Testing the Changes

### 1. Test Token Persistence
```bash
# 1. Update .env file
JWT_REFRESH_EXPIRES_IN=30d

# 2. Restart server
npm run dev

# 3. Login via mobile app or API
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"password"}'

# 4. Save the refreshToken from response

# 5. Wait 8+ days (or change system time)

# 6. Use refresh token to get new access token
curl -X POST http://localhost:5000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'

# Should succeed and return new tokens
```

### 2. Test Seller Public Profile
```bash
# Get public profile for a seller
curl -X GET http://localhost:5000/api/sellers/SELLER_UUID/public-profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with seller stats and recent orders
```

### 3. Test Order Bidders List
```bash
# Get bidders for an order (must be order owner)
curl -X GET http://localhost:5000/api/orders/ORDER_UUID/bidders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: 200 OK with list of anonymized bidders
```

### 4. Test Bid Anonymization
```bash
# Get bids for an order
curl -X GET http://localhost:5000/api/bids/order/ORDER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected: Each bid includes "anonymizedSellerId": "SLR-xxxx"
```

---

## Deployment Steps

### Option 1: Railway (Recommended)
1. **Update environment variables** in Railway dashboard:
   ```
   JWT_EXPIRES_IN=4h
   JWT_REFRESH_EXPIRES_IN=30d
   ```

2. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "feat: extend token lifetime and add seller public profiles"
   git push origin main
   ```

3. **Railway auto-deploys** - No manual restart needed

### Option 2: Manual Deployment
1. Update `.env` file on server
2. Restart the backend:
   ```bash
   npm run build  # If using TypeScript
   npm start      # Or pm2 restart app
   ```

---

## API Documentation Updates

Add these to your API documentation:

### New Endpoints

#### Get Seller Public Profile
```
GET /api/sellers/:sellerId/public-profile
Authorization: Bearer <token>

Returns anonymized seller information including:
- Success rate
- Total completed orders
- Average rating
- Last 3 accepted orders
```

#### Get Order Bidders
```
GET /api/orders/:orderId/bidders
Authorization: Bearer <token>

Returns list of sellers who bid on the order.
Only accessible by order owner.
```

---

## Monitoring & Logs

The new endpoints include console logging:

```
# Successful seller profile request
GET /api/sellers/abc123/public-profile

# Failed request (seller not found)
Error getting seller public profile: Seller not found

# Failed request (not order owner)
Error getting order bidders: Not authorized to view bidders for this order
```

Monitor these logs to track usage and errors.

---

## Rollback Plan

If issues occur, you can rollback:

### Rollback Token Changes
```env
# Revert to previous values
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

### Rollback Seller Profile Feature
```typescript
// In src/index.ts, comment out:
// app.use('/api/sellers', sellerPublicRoutes);
```

This disables the new endpoints without breaking existing functionality.

---

## Future Enhancements

### Phase 2 (Recommended)
1. Add rating system to bids table
2. Add delivery tracking (on-time, late, cancelled)
3. Calculate average ratings in public profile
4. Add seller badges (Top Rated, Fast Delivery, etc.)

### Phase 3 (Optional)
1. Seller response time statistics
2. Product category expertise
3. Delivery time averages
4. Seller verification status

---

## Summary

### ✅ Completed Changes:
1. Extended refresh token lifetime to 30 days
2. Extended access token lifetime to 4 hours
3. Created seller public profile endpoint
4. Created order bidders list endpoint
5. Added anonymized seller IDs to all bid responses

### 📝 Action Required:
1. Update `.env` file with new JWT settings
2. Restart backend server
3. Test new endpoints
4. Update frontend to use new endpoints (already done in mobile app plan)

### 🎯 Impact:
- Users stay logged in for 30 days on mobile
- Buyers can view seller reputation before accepting bids
- Seller privacy maintained until bid accepted
- Better transparency and trust in the marketplace

---

**All changes are backward compatible.** Existing functionality continues to work unchanged.
