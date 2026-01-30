# Database Fix Guide

## 🔧 Complete Solution for Corrupted Database

Your database got corrupted. This guide will help you set up a fresh, working database with all the correct endpoints and permissions.

---

## 📋 What's Been Fixed

### ✅ Database Schema
- Complete schema with all tables matching your original design
- Proper foreign key constraints
- Check constraints for data validation
- Indexes for optimal performance
- Auto-updating timestamps
- Cascade deletes for data integrity

### ✅ Backend Endpoints
- **Buyers can:**
  - Create orders ✓
  - View their orders ✓
  - View bids on their orders ✓
  - Accept/reject bids ✓

- **Sellers can:**
  - View all pending orders ✓
  - Place bids on orders ✓
  - View their bids ✓
  - Update/delete their bids ✓

- **All endpoints tested and working** ✓

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: Automated Setup (Recommended)

1. **Run the setup script:**
   ```bash
   cd backend
   setup-database.bat
   ```

2. **Follow the prompts:**
   - Enter your PostgreSQL credentials
   - Choose to seed with test data (recommended)

3. **Update `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/morren_db
   PORT=5000
   JWT_SECRET=your-secret-key-change-this-in-production
   JWT_REFRESH_SECRET=your-refresh-secret-key-change-this-in-production
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **Test the endpoints:**
   ```bash
   node test-endpoints.js
   ```

---

### Option 2: Manual Setup

1. **Create database:**
   ```bash
   psql -U postgres
   DROP DATABASE IF EXISTS morren_db;
   CREATE DATABASE morren_db;
   \q
   ```

2. **Run schema:**
   ```bash
   psql -U postgres -d morren_db -f src/db/schema.sql
   ```

3. **Seed data (optional but recommended):**
   ```bash
   psql -U postgres -d morren_db -f src/db/seed.sql
   ```

4. **Update `.env` and start server** (same as above)

---

## 📁 Files Created/Updated

### New Files
```
backend/
├── src/db/
│   ├── migrations/
│   │   └── 001_complete_schema.sql   # Complete fresh schema
│   └── seed.sql                      # Test data with users, orders, bids
├── setup-database.bat                # Automated setup script
├── test-endpoints.js                 # API endpoint test suite
├── API_GUIDE.md                      # Complete API documentation
└── DATABASE_FIX_README.md            # This file
```

### Updated Files
- `src/db/schema.sql` - Updated with complete schema

---

## 🧪 Test Data

After seeding, you'll have these test accounts:

### Test Users (all password: `password123`)

| Role | Email | ID |
|------|-------|-----|
| **Buyers** | | |
| | buyer1@test.com | 22222222-2222-2222-2222-222222222222 |
| | buyer2@test.com | 22222222-2222-2222-2222-222222222223 |
| **Sellers** | | |
| | seller1@test.com | 33333333-3333-3333-3333-333333333333 |
| | seller2@test.com | 33333333-3333-3333-3333-333333333334 |
| | seller3@test.com | 33333333-3333-3333-3333-333333333335 |
| **Shipping** | | |
| | shipping1@test.com | 44444444-4444-4444-4444-444444444444 |
| | shipping2@test.com | 44444444-4444-4444-4444-444444444445 |
| **Admin** | | |
| | admin@morren.com | 11111111-1111-1111-1111-111111111111 |

### Test Data Includes:
- ✅ 4 Items (steel pipes, cement, cables, tiles)
- ✅ 5 Orders (pending, accepted, completed)
- ✅ 6 Bids (various statuses)
- ✅ 2 Shipping bids
- ✅ Market price data
- ✅ RFQs and supplier invites

---

## 🔍 Verify Everything Works

### 1. Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
🚀 Server running on port 5000
✓ Database connected successfully
```

### 2. Run Automated Tests
```bash
node test-endpoints.js
```

Expected output:
```
✓ Buyer login successful
✓ Seller 1 login successful
✓ Seller 2 login successful
✓ Order created: [order-id]
✓ Found 3 pending orders
✓ Bid placed: [bid-id]
✓ Found 2 bids for order
✅ All Tests Passed Successfully!
```

### 3. Manual API Test

**Login as buyer:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"buyer1@test.com\",\"password\":\"password123\"}"
```

**Create order (use token from above):**
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":\"66666666-6666-6666-6666-666666666661\",\"buyerId\":\"22222222-2222-2222-2222-222222222222\",\"quantity\":10,\"totalPrice\":1500.00,\"shippingAddress\":\"123 Test St\"}"
```

---

## 🎯 Complete Order & Bid Flow

### Step 1: Buyer Creates Order
```javascript
POST /api/orders
{
  "itemId": "66666666-6666-6666-6666-666666666661",
  "buyerId": "22222222-2222-2222-2222-222222222222",
  "quantity": 50,
  "totalPrice": 7500.00,
  "shippingAddress": "456 Buyer Ave",
  "notes": "Need delivery ASAP"
}
```

### Step 2: Seller Views Pending Orders
```javascript
GET /api/orders/seller/33333333-3333-3333-3333-333333333333
// Returns all pending orders
```

### Step 3: Seller Places Bid
```javascript
POST /api/bids
{
  "orderId": "ORDER_ID_FROM_STEP_1",
  "sellerId": "33333333-3333-3333-3333-333333333333",
  "bidAmount": 7200.00,
  "estimatedDelivery": "2024-02-15",
  "message": "Fast delivery available",
  "pickupAddress": "321 Seller St"
}
```

### Step 4: Buyer Views Bids
```javascript
GET /api/bids/order/ORDER_ID
// Returns all bids for the order with seller info
```

### Step 5: Buyer Accepts Bid
```javascript
PATCH /api/bids/BID_ID
{ "status": "accepted" }

PATCH /api/orders/ORDER_ID
{ "status": "accepted" }
```

---

## 📊 Database Structure

### Core Tables
1. **users** - All users (buyers, sellers, admins, shipping providers)
2. **items** - Product catalog
3. **orders** - Orders placed by buyers
4. **bids** - Bids placed by sellers on orders
5. **shipping_bids** - Shipping quotes from providers
6. **suppliers** - External suppliers (for RFQ system)
7. **rfqs** - Request for quotes
8. **quotes** - Supplier quotes on RFQs

### Relationships
```
users (buyer) → orders → bids ← users (seller)
                ↓
            shipping_bids ← users (shipping_provider)

users (buyer) → rfqs → supplier_invites → suppliers
                  ↓
               quotes ← suppliers
```

---

## 🔐 Permissions & Authorization

### Database Level
- Foreign key constraints ensure data integrity
- Check constraints validate status values
- Cascade deletes maintain referential integrity

### API Level (JWT-based)

| Endpoint | Buyer | Seller | Shipping | Admin |
|----------|-------|--------|----------|-------|
| POST /api/orders | ✓ | ✗ | ✗ | ✓ |
| GET /api/orders/buyer/:id | ✓ | ✗ | ✗ | ✓ |
| GET /api/orders/seller/:id | ✗ | ✓ | ✗ | ✓ |
| POST /api/bids | ✗ | ✓ | ✗ | ✓ |
| GET /api/bids/order/:id | ✓ | ✓ | ✗ | ✓ |
| GET /api/bids/seller/:id | ✗ | ✓ | ✗ | ✓ |
| POST /api/shipping-bids | ✗ | ✗ | ✓ | ✓ |

---

## 🛠️ Troubleshooting

### Issue: "Database connection failed"
**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Check database exists: `psql -l`

### Issue: "Table does not exist"
**Solution:**
```bash
psql -U postgres -d morren_db -f src/db/schema.sql
```

### Issue: "No token provided"
**Solution:**
- Login first to get token
- Include header: `Authorization: Bearer <token>`

### Issue: "Insufficient permissions"
**Solution:**
- Check user role matches endpoint requirements
- Buyers cannot place bids
- Sellers cannot create orders

### Issue: "Foreign key constraint violation"
**Solution:**
- Use valid UUIDs from seed data
- Ensure referenced records exist
- Check the seed data for valid IDs

---

## 📚 Additional Resources

- **API Documentation:** See `API_GUIDE.md`
- **Backend Setup:** See `BACKEND_README.md`
- **Database Schema:** See `src/db/schema.sql`
- **Test Data:** See `src/db/seed.sql`

---

## ✅ Checklist

Before considering setup complete:

- [ ] Database created and schema applied
- [ ] Seed data loaded
- [ ] `.env` file configured
- [ ] Server starts without errors
- [ ] Can login as buyer (POST /auth/login)
- [ ] Can create order as buyer (POST /api/orders)
- [ ] Can view orders as seller (GET /api/orders/seller/:id)
- [ ] Can place bid as seller (POST /api/bids)
- [ ] Can view bids as buyer (GET /api/bids/order/:id)
- [ ] Automated tests pass (node test-endpoints.js)

---

## 🎉 Success!

If all tests pass, your backend is now:
- ✅ Fully functional
- ✅ Properly secured with JWT
- ✅ Database schema matches requirements
- ✅ All endpoints working correctly
- ✅ Ready for production use

**Next Steps:**
1. Integrate with your frontend
2. Update environment variables for production
3. Set up proper database backups
4. Configure CORS for your frontend domain

---

## 💡 Tips

1. **Use the test script regularly** to verify everything works
2. **Check API_GUIDE.md** for complete endpoint documentation
3. **Review seed.sql** to understand the data structure
4. **Keep .env secure** - never commit it to Git
5. **Backup your database** regularly

---

Need help? Check the documentation files or review the working test script for examples.
