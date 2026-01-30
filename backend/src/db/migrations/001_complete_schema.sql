-- Complete database schema for Morren marketplace
-- This migration creates all tables with proper constraints and permissions

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS notification_logs CASCADE;
DROP TABLE IF EXISTS notification_tokens CASCADE;
DROP TABLE IF EXISTS shipping_bids CASCADE;
DROP TABLE IF EXISTS bids CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS supplier_invites CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS market_prices CASCADE;
DROP TABLE IF EXISTS buyer_profiles CASCADE;
DROP TABLE IF EXISTS rfqs CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ======================
-- USERS TABLE
-- ======================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('buyer', 'seller', 'admin', 'shipping_provider')),
  avatar VARCHAR(500),
  phone VARCHAR(50),
  address TEXT,
  refresh_token TEXT,
  onesignal_player_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- SUPPLIERS TABLE
-- ======================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  contact_person VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- ITEMS TABLE
-- ======================
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL,
  size VARCHAR(50),
  category VARCHAR(100) NOT NULL,
  condition VARCHAR(50) CHECK (condition IN ('new', 'used', 'refurbished')),
  quantity INTEGER DEFAULT 1,
  specifications JSONB DEFAULT '{}'::jsonb,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- ORDERS TABLE
-- ======================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- BIDS TABLE
-- ======================
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  estimated_delivery DATE NOT NULL,
  message TEXT,
  pickup_address TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- SHIPPING BIDS TABLE
-- ======================
CREATE TABLE shipping_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  shipping_provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  estimated_delivery DATE NOT NULL,
  message TEXT,
  quantity_kgs DECIMAL(10, 2),
  port_of_loading VARCHAR(255),
  destination_address TEXT,
  incoterms VARCHAR(50),
  mode VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- RFQS TABLE
-- ======================
CREATE TABLE rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  specs TEXT,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  required_by_date DATE,
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'AWARDED')),
  awarded_to JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- SUPPLIER INVITES TABLE
-- ======================
CREATE TABLE supplier_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'INVITE_SENT' CHECK (status IN ('INVITE_SENT', 'VIEWED', 'QUOTED', 'UPDATED')),
  invite_token VARCHAR(255) UNIQUE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  viewed_at TIMESTAMP WITH TIME ZONE,
  quoted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- QUOTES TABLE
-- ======================
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_name VARCHAR(255) NOT NULL,
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  delivery_days INTEGER,
  validity_days INTEGER,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- MARKET PRICES TABLE
-- ======================
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- BUYER PROFILES TABLE
-- ======================
CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- NOTIFICATION TABLES
-- ======================
CREATE TABLE notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  deviceid VARCHAR(255) NOT NULL,
  platform VARCHAR(50) DEFAULT 'expo',
  createdat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  whatsapp_message_id TEXT,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- INDEXES
-- ======================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bids_order_id ON bids(order_id);
CREATE INDEX IF NOT EXISTS idx_bids_seller_id ON bids(seller_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

CREATE INDEX IF NOT EXISTS idx_shipping_bids_order_id ON shipping_bids(order_id);
CREATE INDEX IF NOT EXISTS idx_shipping_bids_provider_id ON shipping_bids(shipping_provider_id);
CREATE INDEX IF NOT EXISTS idx_shipping_bids_status ON shipping_bids(status);

CREATE INDEX IF NOT EXISTS idx_rfqs_buyer_id ON rfqs(buyer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);

CREATE INDEX IF NOT EXISTS idx_supplier_invites_rfq_id ON supplier_invites(rfq_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invites_token ON supplier_invites(invite_token);

CREATE INDEX IF NOT EXISTS idx_quotes_rfq_id ON quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotes_supplier_id ON quotes(supplier_id);

CREATE INDEX IF NOT EXISTS idx_market_prices_product ON market_prices(product_name);
CREATE INDEX IF NOT EXISTS idx_market_prices_date ON market_prices(date);

CREATE INDEX IF NOT EXISTS idx_notification_tokens_userid ON notification_tokens(userid);
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id ON notification_logs(order_id);

-- ======================
-- TRIGGERS FOR updated_at
-- ======================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shipping_bids_updated_at BEFORE UPDATE ON shipping_bids FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_invites_updated_at BEFORE UPDATE ON supplier_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_tokens_updated_at BEFORE UPDATE ON notification_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_logs_updated_at BEFORE UPDATE ON notification_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- GRANT PERMISSIONS
-- ======================
-- Grant permissions to public (adjust based on your user setup)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
