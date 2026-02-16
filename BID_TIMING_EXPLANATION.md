# Bid Timing System - Morren Marketplace

## 📋 Summary

**Yes, the bid running time is 7 days (1 week) by default.**

However, this can be customized per order through item specifications.

---

## ⏰ How Bid Timing Works

### Default Bid Duration

```javascript
const bidRunningDays = 7; // Default 7 days if not specified
```

**Location:** `lib/auto-accept.ts` (Line 11)

### Two Types of Bidding Periods

#### 1. **Seller Bid Running Time**
- **Duration:** 7 days (default)
- **Starts:** When order is created
- **Ends:** 7 days after order creation
- **Purpose:** Sellers submit bids to fulfill the order

#### 2. **Shipping Bid Running Time**
- **Duration:** 7 days (default)
- **Starts:** When seller bid is accepted (order status = 'accepted')
- **Ends:** 7 days after seller bid acceptance
- **Purpose:** Shipping providers submit bids to deliver the order

---

## 🔧 How to Customize Bid Duration

### Method 1: Set in Item Specifications (Recommended)

When creating an item, add specifications:

```json
{
  "name": "Organic Tomatoes",
  "description": "Fresh organic tomatoes",
  "category": "vegetables",
  "price": 50.00,
  "quantity": 100,
  "specifications": {
    "Seller Bid Running Time (days)": "14",
    "Shipping Bid Running Time (days)": "7"
  }
}
```

**Supported Specification Keys:**
- `"Seller Bid Running Time (days)"` - For seller bids
- `"Shipping Bid Running Time (days)"` - For shipping bids
- `"Bid Running Time (days)"` - Fallback for both
- `"bidRunningTime"` - Alternative key

### Method 2: Change Default in Code

**File:** `lib/auto-accept.ts`

**For Seller Bids (Line 11):**
```typescript
const bidRunningDays = 7; // Change to 14 for 2 weeks, 3 for 3 days, etc.
```

**For Shipping Bids (Line 36):**
```typescript
const bidRunningDays = 7; // Change to your desired default
```

---

## 🤖 Auto-Accept Mechanism

### What Happens When Bid Time Expires?

#### For Seller Bids:
1. **Time Expires:** 7 days after order creation
2. **System Checks:** Are there pending bids?
3. **If YES:**
   - ✅ Auto-accept the **lowest bid** (best price for buyer)
   - ❌ Reject all other bids
   - 📝 Update order status to 'accepted'
4. **If NO:**
   - ❌ Mark order as 'rejected' (no sellers interested)

#### For Shipping Bids:
1. **Time Expires:** 7 days after seller bid acceptance
2. **System Checks:** Are there pending shipping bids?
3. **If YES:**
   - ✅ Auto-accept the **lowest shipping bid**
   - ❌ Reject all other shipping bids
   - 📝 Update order status to 'completed'
4. **If NO:**
   - Order remains in 'accepted' status (waiting for shipping)

---

## 📊 Bid Timeline Example

### Scenario: Order with Default 7-Day Bidding

```
Day 0 (Jan 1, 2026 10:00 AM)
├─ Order Created
├─ Status: "pending"
└─ Seller bidding starts

Day 1-7
├─ Sellers submit bids
├─ Buyer can manually accept/reject bids
└─ Bids remain "pending"

Day 7 (Jan 8, 2026 10:00 AM)
├─ Seller bid time expires
├─ Auto-accept triggered
├─ Lowest bid accepted
├─ Other bids rejected
├─ Order status → "accepted"
└─ Shipping bidding starts

Day 8-14
├─ Shipping providers submit bids
├─ Buyer can manually accept/reject shipping bids
└─ Shipping bids remain "pending"

Day 14 (Jan 15, 2026 10:00 AM)
├─ Shipping bid time expires
├─ Auto-accept triggered
├─ Lowest shipping bid accepted
├─ Other shipping bids rejected
└─ Order status → "completed"
```

---

## 💻 Code Implementation

### Calculate Bid End Time

**File:** `lib/auto-accept.ts` (Lines 9-19)

```typescript
export function calculateBidEndTime(order: Order): Date {
  const createdAt = new Date(order.createdAt);
  const bidRunningDays = 7; // Default 7 days

  // Check if custom duration specified in item specifications
  const specs = order.item?.specifications as any;
  const specifiedDays = 
    specs?.['Seller Bid Running Time (days)'] || 
    specs?.['Bid Running Time (days)'] || 
    specs?.['bidRunningTime'];
  
  const daysToAdd = specifiedDays ? parseInt(specifiedDays.toString()) : bidRunningDays;

  // Calculate end time
  const endTime = new Date(createdAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
  return endTime;
}
```

### Check if Bid Expired

**File:** `lib/auto-accept.ts` (Lines 24-27)

```typescript
export function isBidExpired(order: Order): boolean {
  const endTime = calculateBidEndTime(order);
  return new Date() > endTime;
}
```

### Auto-Accept Logic

**File:** `lib/auto-accept.ts` (Lines 59-146)

```typescript
export async function autoAcceptSellerBid(
  order: Order,
  bids: Bid[]
): Promise<boolean> {
  // Check if bid time has expired
  if (!isBidExpired(order)) {
    return false;
  }

  // Check if order is still pending
  if (order.status !== 'pending') {
    return false;
  }

  // Get pending bids for this order
  const pendingBids = bids.filter(b =>
    b.orderId === order.id && b.status === 'pending'
  );

  if (pendingBids.length === 0) {
    // No bids to accept, mark order as rejected
    await updateOrder(order.id, { status: 'rejected' });
    return false;
  }

  // Find the lowest bid (best price for buyer)
  const lowestBid = pendingBids.reduce((lowest, bid) =>
    bid.bidAmount < lowest.bidAmount ? bid : lowest
  );

  try {
    // Accept the lowest bid
    await updateBid(lowestBid.id, { status: 'accepted' });

    // Reject all other bids
    const otherBids = pendingBids.filter(b => b.id !== lowestBid.id);
    await Promise.all(
      otherBids.map(bid => updateBid(bid.id, { status: 'rejected' }))
    );

    // Update order status to accepted
    await updateOrder(order.id, { status: 'accepted' });

    return true;
  } catch (error) {
    console.error('Error auto-accepting seller bid:', error);
    return false;
  }
}
```

---

## 🎯 Where Auto-Accept is Triggered

### Frontend (Buyer Dashboard)

**File:** `app/dashboard/buyer/page.tsx`

The auto-accept process is triggered when the buyer views their dashboard:

```typescript
// Process auto-accepts for expired orders
useEffect(() => {
  if (orders.length > 0 && bids.length > 0) {
    processAutoAccepts(orders, bids, shippingBids)
      .then(result => {
        if (result.sellerAccepted > 0 || result.shippingAccepted > 0) {
          // Refresh data to show updated statuses
          fetchOrders();
          fetchBids();
        }
      });
  }
}, [orders, bids, shippingBids]);
```

**Note:** This is a **client-side** implementation. For production, consider moving this to a **backend cron job** for reliability.

---

## 🔄 Backend Implementation (Recommended)

Currently, auto-accept runs on the **frontend** when buyer visits dashboard. For better reliability, implement a **backend cron job**:

### Option 1: Add Cron Job to Backend

**Create:** `backend/src/cron/autoAcceptBids.ts`

```typescript
import cron from 'node-cron';
import { query } from '../db';

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running auto-accept cron job...');
  
  try {
    // Get all pending orders with expired bid time
    const expiredOrders = await query(`
      SELECT o.*, i.specifications
      FROM orders o
      LEFT JOIN items i ON o.item_id = i.id
      WHERE o.status = 'pending'
      AND o.created_at < NOW() - INTERVAL '7 days'
    `);

    for (const order of expiredOrders.rows) {
      // Get pending bids for this order
      const bids = await query(
        'SELECT * FROM bids WHERE order_id = $1 AND status = $2',
        [order.id, 'pending']
      );

      if (bids.rows.length === 0) {
        // No bids, reject order
        await query(
          'UPDATE orders SET status = $1 WHERE id = $2',
          ['rejected', order.id]
        );
        continue;
      }

      // Find lowest bid
      const lowestBid = bids.rows.reduce((lowest, bid) =>
        bid.bid_amount < lowest.bid_amount ? bid : lowest
      );

      // Accept lowest bid
      await query(
        'UPDATE bids SET status = $1 WHERE id = $2',
        ['accepted', lowestBid.id]
      );

      // Reject other bids
      await query(
        'UPDATE bids SET status = $1 WHERE order_id = $2 AND id != $3',
        ['rejected', order.id, lowestBid.id]
      );

      // Update order status
      await query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['accepted', order.id]
      );

      console.log(`Auto-accepted bid ${lowestBid.id} for order ${order.id}`);
    }

    console.log('Auto-accept cron job completed');
  } catch (error) {
    console.error('Auto-accept cron job error:', error);
  }
});
```

**Install dependency:**
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

**Import in `backend/src/index.ts`:**
```typescript
import './cron/autoAcceptBids';
```

---

## 📝 Database Schema

### Bids Table

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  seller_id UUID REFERENCES users(id),
  bid_amount DECIMAL(10, 2) NOT NULL,
  estimated_delivery DATE,
  message TEXT,
  pickup_address TEXT,
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Shipping Bids Table

```sql
CREATE TABLE shipping_bids (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  shipping_provider_id UUID REFERENCES users(id),
  bid_amount DECIMAL(10, 2) NOT NULL,
  estimated_delivery DATE,
  message TEXT,
  quantity_kgs DECIMAL(10, 2),
  port_of_loading VARCHAR(255),
  destination_address TEXT,
  incoterms VARCHAR(50),
  mode VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 UI Display of Bid Time

### Show Remaining Time to Buyer

```typescript
import { calculateBidEndTime, isBidExpired } from '@/lib/auto-accept';

function BidTimer({ order }: { order: Order }) {
  const endTime = calculateBidEndTime(order);
  const isExpired = isBidExpired(order);
  const timeRemaining = endTime.getTime() - Date.now();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  if (isExpired) {
    return <span className="text-red-500">Bid time expired</span>;
  }

  return (
    <span className="text-orange-500">
      {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
    </span>
  );
}
```

---

## 🔍 How to Check Bid Status

### Via API

```bash
# Get all bids for an order
curl https://api.zentrip.social/api/bids/order/{orderId}

# Get specific bid
curl https://api.zentrip.social/api/bids/{bidId} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Via Database

```sql
-- Check all pending bids
SELECT o.id, o.created_at, o.status, COUNT(b.id) as bid_count
FROM orders o
LEFT JOIN bids b ON o.id = b.order_id AND b.status = 'pending'
WHERE o.status = 'pending'
GROUP BY o.id, o.created_at, o.status;

-- Check if bid time expired for specific order
SELECT 
  id,
  created_at,
  created_at + INTERVAL '7 days' as bid_end_time,
  NOW() > (created_at + INTERVAL '7 days') as is_expired
FROM orders
WHERE id = 'YOUR_ORDER_ID';
```

---

## ⚙️ Configuration Options

### Change Default Bid Duration Globally

**File:** `lib/auto-accept.ts`

```typescript
// Line 11 - Seller bid duration
const bidRunningDays = 14; // Change from 7 to 14 for 2 weeks

// Line 36 - Shipping bid duration
const bidRunningDays = 10; // Change from 7 to 10 days
```

### Set Per-Order Bid Duration

**When creating an order, set in item specifications:**

```typescript
const item = {
  name: "Urgent Order - Fast Bidding",
  specifications: {
    "Seller Bid Running Time (days)": "3",  // Only 3 days for urgent orders
    "Shipping Bid Running Time (days)": "2"  // 2 days for shipping
  }
};
```

---

## 🚨 Important Notes

### 1. **Manual Override**
- Buyers can manually accept/reject bids **before** the time expires
- Manual acceptance stops the auto-accept process

### 2. **No Bids Scenario**
- If no bids are received by expiration, order is marked as **'rejected'**
- Buyer needs to create a new order

### 3. **Lowest Bid Selection**
- System always selects the **lowest bid amount**
- This gives the best price to the buyer

### 4. **Frontend vs Backend**
- Current implementation: **Frontend** (runs when buyer visits dashboard)
- Recommended: **Backend cron job** (more reliable, runs automatically)

### 5. **Time Zone**
- All times are stored in **UTC** in the database
- Frontend displays in user's local time zone

---

## 📊 Testing Bid Auto-Accept

### Test with Short Duration

**For testing, temporarily change to 1 minute:**

```typescript
// lib/auto-accept.ts (Line 11)
const bidRunningDays = 1 / (24 * 60); // 1 minute instead of 7 days
```

**Or use specifications:**
```json
{
  "specifications": {
    "Seller Bid Running Time (days)": "0.0007"  // ~1 minute
  }
}
```

### Test Steps

1. Create an order with short bid duration
2. Create 2-3 bids with different amounts
3. Wait for expiration time
4. Visit buyer dashboard (triggers auto-accept)
5. Verify lowest bid is accepted, others rejected
6. Check order status changed to 'accepted'

---

## 🎯 Summary

| Aspect | Details |
|--------|---------|
| **Default Duration** | 7 days (1 week) |
| **Customizable** | Yes, via item specifications |
| **Auto-Accept** | Yes, lowest bid is auto-accepted |
| **Trigger** | Frontend (buyer dashboard visit) |
| **Recommended** | Backend cron job for reliability |
| **Manual Override** | Yes, buyer can accept/reject anytime |
| **No Bids** | Order marked as 'rejected' |

---

## 📞 Related Files

- **Auto-Accept Logic:** `lib/auto-accept.ts`
- **Bid Controller:** `backend/src/controllers/bidController.ts`
- **Shipping Bid Controller:** `backend/src/controllers/shippingBidController.ts`
- **Order Controller:** `backend/src/controllers/orderController.ts`
- **Buyer Dashboard:** `app/dashboard/buyer/page.tsx`
- **Database Schema:** `backend/src/db/schema.sql`

---

**Last Updated:** February 16, 2026  
**Version:** 1.0
