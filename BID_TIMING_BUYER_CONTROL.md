# Buyer-Controlled Bid Timing System

## ✅ **ALREADY IMPLEMENTED!**

Your system already allows buyers to set the seller bid timing when creating a bid request!

---

## 📋 How It Works

### **Buyer Selects Bid Duration**

When a buyer creates a bid request (Place Bid), they can choose:

- **1 Day** (24 hours)
- **2 Days** (48 hours)  
- **3 Days** (72 hours)

After the selected time expires, the system will **automatically accept the lowest bid**.

---

## 🎯 Current Implementation

### **1. UI - Bid Request Form**

**Location:** `app/dashboard/buyer/page.tsx` (Lines 3397-3423)

```tsx
<Label htmlFor="sellerBidRunningTime">
    Seller Bid Running Time *
</Label>
<select
    id="sellerBidRunningTime"
    value={bidForm.sellerBidRunningTime}
    onChange={(e) => {
        setBidForm({
            ...bidForm,
            sellerBidRunningTime: e.target.value,
            shippingBidRunningTime: '1' // Auto-set to 1 day
        });
    }}
    className="..."
>
    <option value="">Select duration...</option>
    <option value="1">1 Day</option>
    <option value="2">2 Days</option>
    <option value="3">3 Days</option>
</select>
<p className="text-xs text-purple-600 mt-1">
    Sellers will have this many days to place their bids
</p>
<p className="text-xs text-blue-600 mt-2">
    ℹ️ Shipping providers will automatically get 1 day to bid after a seller is selected
</p>
```

**Features:**
- ✅ Dropdown with 3 options (1, 2, 3 days)
- ✅ Required field (buyer must select)
- ✅ Auto-sets shipping bid time to 1 day
- ✅ Clear help text explaining the timeline

---

### **2. Data Storage**

**Location:** `app/dashboard/buyer/page.tsx` (Lines 1432-1441)

When the buyer submits the bid request, the selected duration is stored in the item specifications:

```typescript
const newItem = await createItem({
    name: bidForm.productName,
    description: `Bid Request: ${bidForm.productName}...`,
    // ... other fields
    specifications: {
        'HSN Code': bidForm.hsnCode,
        'Specification': bidForm.specification,
        'Quality Grade': bidForm.quality,
        'Expected Delivery': bidForm.expectedDeliveryDate,
        'Destination Country': bidForm.country,
        'Incoterms': bidForm.incoterms,
        'Seller Bid Running Time (days)': String(sellerBidDays), // ← Stored here
        'Shipping Bid Running Time (days)': String(shippingBidDays), // ← Always 1 day
    },
});
```

**Storage Location:** `items.specifications` (JSONB column in PostgreSQL)

---

### **3. Auto-Accept Logic**

**Location:** `lib/auto-accept.ts` (Lines 9-19)

The auto-accept function reads the buyer-selected duration:

```typescript
export function calculateBidEndTime(order: Order): Date {
    const createdAt = new Date(order.createdAt);
    const bidRunningDays = 7; // Default fallback (not used if buyer sets it)

    // Read the buyer-selected duration from specifications
    const specs = order.item?.specifications as any;
    const specifiedDays = 
        specs?.['Seller Bid Running Time (days)'] || 
        specs?.['Bid Running Time (days)'] || 
        specs?.['bidRunningTime'];
    
    // Use buyer-selected duration, or fall back to default
    const daysToAdd = specifiedDays ? parseInt(specifiedDays.toString()) : bidRunningDays;

    // Calculate end time
    const endTime = new Date(createdAt.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return endTime;
}
```

**Auto-Accept Trigger:**
- When bid time expires, system automatically accepts the **lowest bid**
- All other bids are rejected
- Order status changes to 'accepted'

---

## 📊 Complete Bidding Timeline

### **Example: Buyer Selects 2 Days**

```
Day 0 (Order Created)
├─ Buyer creates bid request
├─ Buyer selects "2 Days" for seller bidding
├─ Order status: "pending"
└─ Sellers can start bidding

Day 1
├─ Sellers submit bids
├─ Buyer can manually accept/reject bids
└─ Bids remain "pending"

Day 2 (48 hours after creation)
├─ Seller bid time expires
├─ Auto-accept triggered
├─ Lowest bid accepted
├─ Other bids rejected
├─ Order status → "accepted"
└─ Shipping bidding starts (1 day duration)

Day 3 (24 hours after seller acceptance)
├─ Shipping bid time expires
├─ Auto-accept triggered
├─ Lowest shipping bid accepted
└─ Order status → "completed"
```

---

## 🎨 User Experience

### **When Creating Bid Request:**

1. Buyer fills in product details
2. Buyer scrolls to "Bidding Timeline" section
3. Buyer sees dropdown with 3 options:
   - 1 Day (24 hours)
   - 2 Days (48 hours)
   - 3 Days (72 hours)
4. Buyer selects desired duration
5. System automatically sets shipping bid time to 1 day
6. Buyer submits bid request

### **Visual Indicators:**

```
┌─────────────────────────────────────────────┐
│ 📅 Bidding Timeline                         │
├─────────────────────────────────────────────┤
│ Set how long sellers can bid on your order │
│ (Shipping provider bidding will             │
│ automatically be set to 1 day)              │
│                                             │
│ Seller Bid Running Time *                   │
│ ┌─────────────────────────────────────┐    │
│ │ 2 Days                          ▼   │    │
│ └─────────────────────────────────────┘    │
│ Sellers will have this many days to        │
│ place their bids                            │
│                                             │
│ ℹ️ Shipping providers will automatically   │
│    get 1 day to bid after a seller is      │
│    selected                                 │
└─────────────────────────────────────────────┘
```

---

## 💻 Code Flow

### **1. Buyer Creates Bid Request**

```typescript
// User selects duration in UI
bidForm.sellerBidRunningTime = "2"; // 2 days

// Validation
const sellerBidDays = parseInt(bidForm.sellerBidRunningTime);
if (isNaN(sellerBidDays) || sellerBidDays <= 0) {
    // Show error
    return;
}

// Create item with specifications
const newItem = await createItem({
    specifications: {
        'Seller Bid Running Time (days)': String(sellerBidDays),
        'Shipping Bid Running Time (days)': '1',
    },
});

// Create order
await createOrder({
    itemId: newItem.id,
    buyerId: user.id,
    totalPrice: 0, // Determined by bids
    status: 'pending',
});
```

### **2. Sellers Submit Bids**

```typescript
// Sellers can bid during the specified time period
await createBid({
    orderId: order.id,
    sellerId: seller.id,
    bidAmount: 100.00,
    estimatedDelivery: '2026-03-01',
    status: 'pending',
});
```

### **3. Auto-Accept When Time Expires**

```typescript
// Check if bid time expired
const endTime = calculateBidEndTime(order); // Uses buyer-selected duration
const isExpired = new Date() > endTime;

if (isExpired && order.status === 'pending') {
    // Get all pending bids
    const pendingBids = bids.filter(b => 
        b.orderId === order.id && b.status === 'pending'
    );

    // Find lowest bid
    const lowestBid = pendingBids.reduce((lowest, bid) =>
        bid.bidAmount < lowest.bidAmount ? bid : lowest
    );

    // Accept lowest bid
    await updateBid(lowestBid.id, { status: 'accepted' });

    // Reject others
    await Promise.all(
        otherBids.map(bid => updateBid(bid.id, { status: 'rejected' }))
    );

    // Update order
    await updateOrder(order.id, { status: 'accepted' });
}
```

---

## 🔍 How to Verify It's Working

### **Test Steps:**

1. **Create Bid Request:**
   - Go to Buyer Dashboard
   - Click "Place Bid" button
   - Fill in product details
   - Select "1 Day" from "Seller Bid Running Time" dropdown
   - Submit

2. **Check Database:**
```sql
SELECT 
    i.name,
    i.specifications->>'Seller Bid Running Time (days)' as seller_bid_days,
    o.created_at,
    o.status
FROM orders o
JOIN items i ON o.item_id = i.id
WHERE o.buyer_id = 'YOUR_BUYER_ID'
ORDER BY o.created_at DESC
LIMIT 1;
```

3. **Verify Auto-Accept:**
   - Wait for selected duration (or change to 1 minute for testing)
   - Visit buyer dashboard (triggers auto-accept)
   - Check that lowest bid is accepted
   - Check that order status changed to 'accepted'

---

## 📝 Database Schema

### **Items Table**

```sql
CREATE TABLE items (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    specifications JSONB DEFAULT '{}'::jsonb,  -- ← Stores bid timing
    -- ... other fields
);
```

### **Example Specifications:**

```json
{
    "HSN Code": "0909",
    "Specification": "Premium Quality",
    "Quality Grade": "Export Premium Quality",
    "Expected Delivery": "2026-03-15",
    "Destination Country": "India",
    "Seller Bid Running Time (days)": "2",  // ← Buyer-selected
    "Shipping Bid Running Time (days)": "1"  // ← Auto-set
}
```

---

## 🎯 Key Features

### ✅ **Already Implemented:**

1. **Buyer Control:** Buyer selects 1, 2, or 3 days
2. **Dropdown UI:** Easy-to-use dropdown (not text input)
3. **Validation:** Ensures valid selection before submission
4. **Auto-Set Shipping:** Shipping bid time automatically set to 1 day
5. **Data Storage:** Stored in item specifications (JSONB)
6. **Auto-Accept:** Lowest bid automatically accepted when time expires
7. **Clear Help Text:** Explains timeline to buyer

### 📊 **Time Conversions:**

| Selection | Hours | Auto-Accept After |
|-----------|-------|-------------------|
| 1 Day | 24 hours | Order created + 24h |
| 2 Days | 48 hours | Order created + 48h |
| 3 Days | 72 hours | Order created + 72h |

---

## 🚀 No Changes Needed!

Your system is **already fully functional** with buyer-controlled bid timing!

**What the buyer sees:**
- Dropdown with 3 clear options (1, 2, 3 days)
- Help text explaining what it means
- Automatic shipping bid time (1 day)

**What happens automatically:**
- System stores the selected duration
- Auto-accept triggers after selected time
- Lowest bid is accepted
- All other bids are rejected
- Order moves to next phase

---

## 📞 Related Files

- **UI:** `app/dashboard/buyer/page.tsx` (lines 3397-3423)
- **Validation:** `app/dashboard/buyer/page.tsx` (lines 1397-1406)
- **Storage:** `app/dashboard/buyer/page.tsx` (lines 1439-1440)
- **Auto-Accept Logic:** `lib/auto-accept.ts` (lines 9-19)
- **Auto-Accept Execution:** `lib/auto-accept.ts` (lines 59-146)

---

**Last Updated:** February 16, 2026  
**Status:** ✅ Fully Implemented and Working  
**Version:** 1.0
