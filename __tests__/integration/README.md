# Real Supabase Performance Testing

This directory contains integration tests that measure actual performance against a real Supabase database.

## Setup Instructions

### 1. Create Test Supabase Project
Create a separate Supabase project specifically for testing (never use production database).

### 2. Environment Variables
Create a `.env.test` file in the project root:

```bash
# Test Supabase Credentials
SUPABASE_TEST_URL=https://your-test-project-id.supabase.co
SUPABASE_TEST_ANON_KEY=your-test-anon-key

# Optional: Test specific settings
TEST_BATCH_SIZE=20
TEST_TIMEOUT=30000
```

### 3. Database Schema
Ensure your test database has the required tables. Run these SQL commands in your Supabase test project:

```sql
-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('buyer', 'seller', 'shipping_provider', 'admin')),
  phone VARCHAR,
  address TEXT,
  avatar VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  category VARCHAR,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'sold_out')),
  condition VARCHAR DEFAULT 'new' CHECK (condition IN ('new', 'used', 'refurbished')),
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'rejected')),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bids table
CREATE TABLE bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  estimated_delivery DATE,
  message TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping bids table
CREATE TABLE shipping_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  shipping_provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10,2) NOT NULL,
  estimated_delivery DATE,
  message TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_items_seller_id ON items(seller_id);
CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_item_id ON orders(item_id);
CREATE INDEX idx_bids_order_id ON bids(order_id);
CREATE INDEX idx_bids_seller_id ON bids(seller_id);
CREATE INDEX idx_shipping_bids_order_id ON shipping_bids(order_id);
CREATE INDEX idx_shipping_bids_provider_id ON shipping_bids(shipping_provider_id);
```

### 4. Row Level Security (RLS)
For testing purposes, you may want to disable RLS or create permissive policies:

```sql
-- Disable RLS for testing (WARNING: Only for test database!)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_bids DISABLE ROW LEVEL SECURITY;
```

## Running Performance Tests

### Run Integration Tests
```bash
# Set environment variables
export SUPABASE_TEST_URL="https://your-test-project.supabase.co"
export SUPABASE_TEST_ANON_KEY="your-test-anon-key"

# Run integration tests
npm run test:integration
```

### Expected Performance Baselines

With a real Supabase database, expect these realistic performance metrics:

**Good Performance:**
- User Creation: 10-50 operations/second
- Item Creation: 20-100 operations/second  
- Order Creation: 5-25 operations/second
- Bid Creation: 15-75 operations/second
- Read Operations: 50-200 operations/second

**Average Latency:**
- Simple Inserts: 50-200ms per operation
- Complex Inserts (with FK): 100-500ms per operation
- Reads: 20-100ms per operation
- Concurrent Operations: 200-1000ms per operation

**Factors Affecting Performance:**
- Geographic distance to Supabase servers
- Internet connection speed and stability
- Database plan (Free tier has limitations)
- Concurrent connections and database load
- Query complexity and indexes

## Test Structure

The integration tests include:

1. **User Operations**: Create, read, update performance
2. **Order Workflow**: Complete order creation with real latency
3. **Concurrent Operations**: Multiple simultaneous operations
4. **Error Handling**: Database constraint violations
5. **Cleanup**: Automatic test data removal

## Interpreting Results

The tests will output detailed performance metrics:

```
📊 === REAL SUPABASE PERFORMANCE RESULTS ===

🎯 User Creation:
   📦 Operations: 20
   ⏱️  Duration: 2,450.23ms
   ⚡ RPS: 8.16/second
   📡 Avg Latency: 122.51ms
   ❌ Errors: 0

📈 OVERALL SUMMARY:
   🔢 Total Operations: 150
   ⏱️  Total Duration: 15,230.45ms
   ⚡ Overall RPS: 9.85/second
   ❌ Total Errors: 0
   ✅ Success Rate: 100.00%
```

## Safety Features

- **Automatic Cleanup**: All test data is automatically removed
- **Separate Database**: Never runs against production
- **Error Handling**: Graceful failure handling
- **Timeouts**: Prevents hanging tests
- **Batch Limits**: Reasonable test sizes to avoid overwhelming database

## Troubleshooting

**Tests Skipped:**
- Check environment variables are set correctly
- Verify test database URL and key

**Slow Performance:**
- Check internet connection
- Verify database location/region
- Consider upgrading Supabase plan
- Check for database indexes

**Connection Errors:**
- Verify Supabase project is active
- Check API key permissions
- Ensure RLS policies allow operations