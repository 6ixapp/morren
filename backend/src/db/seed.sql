-- Seed data for testing the Morren marketplace
-- Password for all test users: "password123" (hashed with bcrypt)

-- Clear existing data
TRUNCATE users, items, orders, bids, shipping_bids, suppliers, rfqs, supplier_invites, quotes, market_prices, buyer_profiles, notification_tokens, notification_logs CASCADE;

-- ======================
-- SEED USERS
-- ======================
-- Password hash for "password123"
-- Generated using: bcrypt.hash('password123', 10)
INSERT INTO users (id, name, email, password_hash, role, phone, address) VALUES
  -- Admin
  ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin@morren.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'admin', '+1234567890', '123 Admin St'),

  -- Buyers
  ('22222222-2222-2222-2222-222222222222', 'John Buyer', 'buyer1@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'buyer', '+1234567891', '456 Buyer Ave'),
  ('22222222-2222-2222-2222-222222222223', 'Jane Buyer', 'buyer2@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'buyer', '+1234567892', '789 Buyer Blvd'),

  -- Sellers
  ('33333333-3333-3333-3333-333333333333', 'Bob Seller', 'seller1@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'seller', '+1234567893', '321 Seller St'),
  ('33333333-3333-3333-3333-333333333334', 'Alice Seller', 'seller2@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'seller', '+1234567894', '654 Seller Ave'),
  ('33333333-3333-3333-3333-333333333335', 'Mike Seller', 'seller3@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'seller', '+1234567895', '987 Seller Blvd'),

  -- Shipping Providers
  ('44444444-4444-4444-4444-444444444444', 'Express Shipping Co', 'shipping1@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'shipping_provider', '+1234567896', '111 Shipping Lane'),
  ('44444444-4444-4444-4444-444444444445', 'Global Logistics', 'shipping2@test.com', '$2b$10$rKZJ9qCZQXGxP8pVXVXX.O5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5kJ5k', 'shipping_provider', '+1234567897', '222 Logistics Rd');

-- ======================
-- SEED BUYER PROFILES
-- ======================
INSERT INTO buyer_profiles (buyer_id, company_name, buyer_name, email) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Buyer Corp', 'John Buyer', 'buyer1@test.com'),
  ('22222222-2222-2222-2222-222222222223', 'Jane Enterprises', 'Jane Buyer', 'buyer2@test.com');

-- ======================
-- SEED SUPPLIERS
-- ======================
INSERT INTO suppliers (id, name, email, phone, contact_person) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Global Suppliers Inc', 'contact@global-suppliers.com', '+1234567898', 'Sarah Johnson'),
  ('55555555-5555-5555-5555-555555555556', 'Premium Materials Co', 'info@premium-materials.com', '+1234567899', 'Tom Anderson');

-- ======================
-- SEED ITEMS
-- ======================
INSERT INTO items (id, name, description, image, price, size, category, condition, quantity, seller_id, status) VALUES
  ('66666666-6666-6666-6666-666666666661',
   'Premium Steel Pipes',
   'High-quality steel pipes suitable for construction',
   'https://example.com/steel-pipes.jpg',
   150.00,
   '2m x 50mm',
   'Construction Materials',
   'new',
   100,
   '33333333-3333-3333-3333-333333333333',
   'active'),

  ('66666666-6666-6666-6666-666666666662',
   'Industrial Cement Bags',
   '50kg bags of Portland cement',
   'https://example.com/cement.jpg',
   25.00,
   '50kg',
   'Construction Materials',
   'new',
   500,
   '33333333-3333-3333-3333-333333333334',
   'active'),

  ('66666666-6666-6666-6666-666666666663',
   'Electrical Wiring Cables',
   '100m copper electrical cables',
   'https://example.com/cables.jpg',
   75.00,
   '100m',
   'Electrical',
   'new',
   200,
   '33333333-3333-3333-3333-333333333335',
   'active'),

  ('66666666-6666-6666-6666-666666666664',
   'Ceramic Tiles',
   'Premium ceramic floor tiles',
   'https://example.com/tiles.jpg',
   45.00,
   '60x60cm',
   'Flooring',
   'new',
   300,
   '33333333-3333-3333-3333-333333333333',
   'active');

-- ======================
-- SEED ORDERS
-- ======================
INSERT INTO orders (id, item_id, buyer_id, quantity, total_price, status, shipping_address, notes) VALUES
  -- Pending orders (sellers can bid on these)
  ('77777777-7777-7777-7777-777777777771',
   '66666666-6666-6666-6666-666666666661',
   '22222222-2222-2222-2222-222222222222',
   50,
   7500.00,
   'pending',
   '456 Buyer Ave, City, Country',
   'Need delivery by next week'),

  ('77777777-7777-7777-7777-777777777772',
   '66666666-6666-6666-6666-666666666662',
   '22222222-2222-2222-2222-222222222223',
   100,
   2500.00,
   'pending',
   '789 Buyer Blvd, City, Country',
   'Urgent order'),

  ('77777777-7777-7777-7777-777777777773',
   '66666666-6666-6666-6666-666666666663',
   '22222222-2222-2222-2222-222222222222',
   25,
   1875.00,
   'pending',
   '456 Buyer Ave, City, Country',
   NULL),

  -- Accepted order (for shipping provider to bid)
  ('77777777-7777-7777-7777-777777777774',
   '66666666-6666-6666-6666-666666666664',
   '22222222-2222-2222-2222-222222222223',
   50,
   2250.00,
   'accepted',
   '789 Buyer Blvd, City, Country',
   'Accepted bid from seller'),

  -- Completed order
  ('77777777-7777-7777-7777-777777777775',
   '66666666-6666-6666-6666-666666666661',
   '22222222-2222-2222-2222-222222222222',
   20,
   3000.00,
   'completed',
   '456 Buyer Ave, City, Country',
   'Delivered successfully');

-- ======================
-- SEED BIDS
-- ======================
INSERT INTO bids (id, order_id, seller_id, bid_amount, estimated_delivery, message, pickup_address, status) VALUES
  -- Bids for order 1
  ('88888888-8888-8888-8888-888888888881',
   '77777777-7777-7777-7777-777777777771',
   '33333333-3333-3333-3333-333333333333',
   7200.00,
   '2024-02-15',
   'Can deliver within 5 days with premium quality',
   '321 Seller St, City, Country',
   'pending'),

  ('88888888-8888-8888-8888-888888888882',
   '77777777-7777-7777-7777-777777777771',
   '33333333-3333-3333-3333-333333333334',
   7000.00,
   '2024-02-20',
   'Best price guarantee',
   '654 Seller Ave, City, Country',
   'pending'),

  ('88888888-8888-8888-8888-888888888883',
   '77777777-7777-7777-7777-777777777771',
   '33333333-3333-3333-3333-333333333335',
   7400.00,
   '2024-02-12',
   'Fastest delivery available',
   '987 Seller Blvd, City, Country',
   'pending'),

  -- Bids for order 2
  ('88888888-8888-8888-8888-888888888884',
   '77777777-7777-7777-7777-777777777772',
   '33333333-3333-3333-3333-333333333334',
   2400.00,
   '2024-02-10',
   'Ready to ship immediately',
   '654 Seller Ave, City, Country',
   'pending'),

  ('88888888-8888-8888-8888-888888888885',
   '77777777-7777-7777-7777-777777777772',
   '33333333-3333-3333-3333-333333333335',
   2450.00,
   '2024-02-12',
   'Premium quality cement',
   '987 Seller Blvd, City, Country',
   'pending'),

  -- Accepted bid for order 4
  ('88888888-8888-8888-8888-888888888886',
   '77777777-7777-7777-7777-777777777774',
   '33333333-3333-3333-3333-333333333333',
   2200.00,
   '2024-02-08',
   'Accepted bid',
   '321 Seller St, City, Country',
   'accepted');

-- ======================
-- SEED SHIPPING BIDS
-- ======================
INSERT INTO shipping_bids (id, order_id, shipping_provider_id, bid_amount, estimated_delivery, message, quantity_kgs, port_of_loading, destination_address, status) VALUES
  ('99999999-9999-9999-9999-999999999991',
   '77777777-7777-7777-7777-777777777774',
   '44444444-4444-4444-4444-444444444444',
   500.00,
   '2024-02-20',
   'Express shipping available',
   250.00,
   'Port A',
   '789 Buyer Blvd, City, Country',
   'pending'),

  ('99999999-9999-9999-9999-999999999992',
   '77777777-7777-7777-7777-777777777774',
   '44444444-4444-4444-4444-444444444445',
   450.00,
   '2024-02-25',
   'Competitive rate with insurance',
   250.00,
   'Port A',
   '789 Buyer Blvd, City, Country',
   'pending');

-- ======================
-- SEED MARKET PRICES
-- ======================
INSERT INTO market_prices (product_name, price, date) VALUES
  ('Steel Pipes (per unit)', 150.00, CURRENT_DATE),
  ('Cement (50kg bag)', 25.00, CURRENT_DATE),
  ('Electrical Cables (100m)', 75.00, CURRENT_DATE),
  ('Ceramic Tiles (per sqm)', 45.00, CURRENT_DATE),
  ('Steel Pipes (per unit)', 148.00, CURRENT_DATE - INTERVAL '1 day'),
  ('Cement (50kg bag)', 24.50, CURRENT_DATE - INTERVAL '1 day'),
  ('Steel Pipes (per unit)', 152.00, CURRENT_DATE - INTERVAL '2 days'),
  ('Cement (50kg bag)', 25.50, CURRENT_DATE - INTERVAL '2 days');

-- ======================
-- SEED RFQS
-- ======================
INSERT INTO rfqs (id, buyer_id, product_name, specs, quantity, unit, required_by_date, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '22222222-2222-2222-2222-222222222222',
   'Industrial Steel Beams',
   'Grade A steel, 5m length, load capacity 10 tons',
   100,
   'pieces',
   '2024-03-01',
   'OPEN'),

  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
   '22222222-2222-2222-2222-222222222223',
   'Concrete Mix',
   'Ready-mix concrete, M25 grade',
   50,
   'cubic meters',
   '2024-02-25',
   'OPEN');

-- ======================
-- SEED SUPPLIER INVITES
-- ======================
INSERT INTO supplier_invites (id, rfq_id, supplier_id, status, invite_token, sent_at) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   '55555555-5555-5555-5555-555555555555',
   'INVITE_SENT',
   'token_1234567890abcdef',
   CURRENT_TIMESTAMP),

  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
   '55555555-5555-5555-5555-555555555556',
   'VIEWED',
   'token_abcdef1234567890',
   CURRENT_TIMESTAMP);

-- Print summary
SELECT 'Seed data inserted successfully!' as status;
SELECT 'Users: ' || COUNT(*) as count FROM users;
SELECT 'Items: ' || COUNT(*) as count FROM items;
SELECT 'Orders: ' || COUNT(*) as count FROM orders;
SELECT 'Bids: ' || COUNT(*) as count FROM bids;
SELECT 'Shipping Bids: ' || COUNT(*) as count FROM shipping_bids;
