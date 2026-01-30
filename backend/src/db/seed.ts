import bcrypt from 'bcrypt';
import pool from './index';

const SALT_ROUNDS = 10;

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ('Admin User', 'admin@morren.com', $1, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [adminPassword]
    );
    console.log('✅ Admin user created (admin@morren.com / admin123)');

    // Create test buyer
    const buyerPassword = await bcrypt.hash('buyer123', SALT_ROUNDS);
    const buyerResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ('Test Buyer', 'buyer@test.com', $1, 'buyer')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [buyerPassword]
    );
    console.log('✅ Test buyer created (buyer@test.com / buyer123)');

    // Create test seller
    const sellerPassword = await bcrypt.hash('seller123', SALT_ROUNDS);
    const sellerResult = await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ('Test Seller', 'seller@test.com', $1, 'seller')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [sellerPassword]
    );
    console.log('✅ Test seller created (seller@test.com / seller123)');

    // Create test shipping provider
    const shipperPassword = await bcrypt.hash('shipper123', SALT_ROUNDS);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ('Test Shipper', 'shipper@test.com', $1, 'shipping_provider')
       ON CONFLICT (email) DO NOTHING`,
      [shipperPassword]
    );
    console.log('✅ Test shipping provider created (shipper@test.com / shipper123)');

    // Create sample items
    if (sellerResult.rows.length > 0) {
      const sellerId = sellerResult.rows[0].id;
      await pool.query(
        `INSERT INTO items (name, description, price, category, quantity, seller_id, status)
         VALUES 
         ('Wheat - Premium Grade', 'High quality wheat for export', 450.00, 'Grains', 1000, $1, 'active'),
         ('Rice - Basmati', 'Long grain basmati rice', 850.00, 'Grains', 500, $1, 'active'),
         ('Corn - Yellow', 'Fresh yellow corn', 320.00, 'Grains', 2000, $1, 'active')
         ON CONFLICT DO NOTHING`,
        [sellerId]
      );
      console.log('✅ Sample items created');
    }

    // Create sample suppliers
    await pool.query(
      `INSERT INTO suppliers (name, email, phone, contact_person)
       VALUES 
       ('Global Suppliers Inc', 'contact@globalsuppliers.com', '+1-555-0100', 'John Doe'),
       ('Eastern Trading Co', 'sales@easterntrading.com', '+1-555-0200', 'Jane Smith'),
       ('Pacific Exports Ltd', 'info@pacificexports.com', '+1-555-0300', 'Mike Johnson')
       ON CONFLICT (email) DO NOTHING`
    );
    console.log('✅ Sample suppliers created');

    // Create sample market prices
    await pool.query(
      `INSERT INTO market_prices (product_name, price, date)
       VALUES 
       ('Wheat', 450.00, CURRENT_DATE - INTERVAL '7 days'),
       ('Wheat', 455.00, CURRENT_DATE - INTERVAL '6 days'),
       ('Wheat', 448.00, CURRENT_DATE - INTERVAL '5 days'),
       ('Rice', 850.00, CURRENT_DATE - INTERVAL '7 days'),
       ('Rice', 860.00, CURRENT_DATE - INTERVAL '6 days'),
       ('Corn', 320.00, CURRENT_DATE - INTERVAL '7 days')`
    );
    console.log('✅ Sample market prices created');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('Test Accounts:');
    console.log('  Admin: admin@morren.com / admin123');
    console.log('  Buyer: buyer@test.com / buyer123');
    console.log('  Seller: seller@test.com / seller123');
    console.log('  Shipper: shipper@test.com / shipper123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
