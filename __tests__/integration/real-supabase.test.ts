/**
 * REAL SUPABASE PERFORMANCE INTEGRATION TESTS
 * 
 * This test suite performs actual operations against a real Supabase database
 * to measure realistic performance metrics with network latency and database constraints.
 * 
 * Setup Required:
 * 1. Create a test Supabase project (separate from production)
 * 2. Set environment variables: SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY
 * 3. Run database migrations on test project
 * 
 * Usage: npm run test:integration
 */

import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

// Test configuration
const TEST_CONFIG = {
  BATCH_SIZE: 20,           // Smaller batches for real testing
  MAX_USERS: 20,           // Realistic test size
  MAX_ITEMS: 25,
  MAX_ORDERS: 15,
  MAX_BIDS_PER_ORDER: 8,
  TIMEOUT: 30000,          // 30 second timeout for real operations
}

// Real Supabase client for integration testing
const supabaseTest = createClient(
  process.env.SUPABASE_TEST_URL || 'https://your-test-project.supabase.co',
  process.env.SUPABASE_TEST_ANON_KEY || 'your-test-anon-key'
)

// Performance metrics tracking
interface PerformanceMetrics {
  operation: string
  count: number
  duration: number
  rps: number // requests per second
  avgLatency: number
  errors: number
}

class PerformanceTracker {
  private metrics: PerformanceMetrics[] = []

  async measureOperation<T>(
    operation: string, 
    count: number, 
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    let errors = 0
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      this.metrics.push({
        operation,
        count,
        duration,
        rps: (count / duration) * 1000,
        avgLatency: duration / count,
        errors
      })
      
      return result
    } catch (error) {
      errors++
      const duration = performance.now() - startTime
      
      this.metrics.push({
        operation,
        count,
        duration,
        rps: 0,
        avgLatency: 0,
        errors
      })
      
      throw error
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return this.metrics
  }

  printSummary(): void {
    console.log('\n📊 === REAL SUPABASE PERFORMANCE RESULTS ===')
    this.metrics.forEach(metric => {
      console.log(`\n🎯 ${metric.operation}:`)
      console.log(`   📦 Operations: ${metric.count}`)
      console.log(`   ⏱️  Duration: ${metric.duration.toFixed(2)}ms`)
      console.log(`   ⚡ RPS: ${metric.rps.toFixed(2)}/second`)
      console.log(`   📡 Avg Latency: ${metric.avgLatency.toFixed(2)}ms`)
      console.log(`   ❌ Errors: ${metric.errors}`)
    })
    
    const totalOperations = this.metrics.reduce((sum, m) => sum + m.count, 0)
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errors, 0)
    
    console.log(`\n📈 OVERALL SUMMARY:`)
    console.log(`   🔢 Total Operations: ${totalOperations}`)
    console.log(`   ⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`)
    console.log(`   ⚡ Overall RPS: ${((totalOperations / totalDuration) * 1000).toFixed(2)}/second`)
    console.log(`   ❌ Total Errors: ${totalErrors}`)
    console.log(`   ✅ Success Rate: ${(((totalOperations - totalErrors) / totalOperations) * 100).toFixed(2)}%`)
  }

  reset(): void {
    this.metrics = []
  }
}

// Test data generators for real Supabase
class RealTestDataGenerator {
  static generateUser() {
    return {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['buyer', 'seller', 'shipping_provider']),
      phone: faker.phone.number(),
      address: faker.location.streetAddress()
    }
  }

  static generateItem(sellerId: string) {
    return {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price()),
      quantity: faker.number.int({ min: 10, max: 1000 }),
      category: faker.commerce.department(),
      seller_id: sellerId,
      status: 'active',
      condition: 'new',
      specifications: {
        weight: faker.number.float({ min: 0.1, max: 50 }),
        dimensions: `${faker.number.int({min: 5, max: 50})}x${faker.number.int({min: 5, max: 50})}x${faker.number.int({min: 5, max: 50})}`
      }
    }
  }

  static generateOrder(buyerId: string, itemId: string) {
    const isInternational = faker.datatype.boolean({ probability: 0.3 })
    const country = isInternational ? faker.location.country() : 'India'
    const incoterms = isInternational ? faker.helpers.arrayElement(['FOB', 'CIF', 'DDP', 'EXW']) : null
    
    const notes = isInternational && incoterms
      ? `Destination: ${country} Incoterms: ${incoterms} Additional notes: ${faker.lorem.sentence()}`
      : `Destination: ${country} Additional notes: ${faker.lorem.sentence()}`

    return {
      buyer_id: buyerId,
      item_id: itemId,
      quantity: faker.number.int({ min: 1, max: 100 }),
      status: faker.helpers.arrayElement(['pending', 'accepted', 'completed', 'cancelled']),
      shipping_address: faker.location.streetAddress(),
      notes
    }
  }

  static generateBid(orderId: string, sellerId: string) {
    return {
      order_id: orderId,
      seller_id: sellerId,
      bid_amount: parseFloat(faker.commerce.price()),
      estimated_delivery: faker.date.future().toISOString().split('T')[0],
      message: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['pending', 'accepted', 'rejected'])
    }
  }

  static generateShippingBid(orderId: string, shippingProviderId: string) {
    return {
      order_id: orderId,
      shipping_provider_id: shippingProviderId,
      bid_amount: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
      estimated_delivery: faker.date.future().toISOString().split('T')[0],
      message: faker.lorem.sentence(),
      status: faker.helpers.arrayElement(['pending', 'accepted', 'rejected'])
    }
  }
}

// Cleanup utility
class TestCleanup {
  private static createdIds: {
    users: string[]
    items: string[]
    orders: string[]
    bids: string[]
    shipping_bids: string[]
  } = {
    users: [],
    items: [],
    orders: [],
    bids: [],
    shipping_bids: []
  }

  static trackCreated(table: string, id: string): void {
    if (this.createdIds[table as keyof typeof this.createdIds]) {
      this.createdIds[table as keyof typeof this.createdIds].push(id)
    }
  }

  static async cleanupAll(): Promise<void> {
    console.log('\n🧹 Starting cleanup of test data...')
    
    try {
      // Delete in reverse dependency order
      await this.deleteRecords('shipping_bids', this.createdIds.shipping_bids)
      await this.deleteRecords('bids', this.createdIds.bids)
      await this.deleteRecords('orders', this.createdIds.orders)
      await this.deleteRecords('items', this.createdIds.items)
      await this.deleteRecords('users', this.createdIds.users)
      
      console.log('✅ Cleanup completed successfully')
      
      // Reset tracking
      this.createdIds = {
        users: [],
        items: [],
        orders: [],
        bids: [],
        shipping_bids: []
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
      throw error
    }
  }

  private static async deleteRecords(table: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return
    
    console.log(`🗑️  Deleting ${ids.length} records from ${table}`)
    
    // Delete in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      const { error } = await supabaseTest
        .from(table)
        .delete()
        .in('id', batch)
      
      if (error) {
        console.error(`❌ Failed to delete batch from ${table}:`, error)
      }
    }
  }
}

// Main test suite
describe('Real Supabase Performance Integration Tests', () => {
  let tracker: PerformanceTracker
  
  // Skip tests if credentials not provided
  beforeAll(() => {
    if (!process.env.SUPABASE_TEST_URL || !process.env.SUPABASE_TEST_ANON_KEY) {
      console.warn('⚠️  Skipping Supabase integration tests - missing test credentials')
      console.warn('Set SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY environment variables')
      return
    }
  })

  beforeEach(() => {
    tracker = new PerformanceTracker()
  })

  afterEach(async () => {
    // Always cleanup after each test
    await TestCleanup.cleanupAll()
    tracker.printSummary()
    tracker.reset()
  })

  describe('User Operations Performance', () => {
    it('should create users with real database performance', async () => {
      const users = Array.from({ length: TEST_CONFIG.MAX_USERS }, () => 
        RealTestDataGenerator.generateUser()
      )

      const createdUsers = await tracker.measureOperation(
        'User Creation', 
        users.length, 
        async () => {
          const { data, error } = await supabaseTest
            .from('users')
            .insert(users)
            .select('id')

          if (error) throw error
          
          // Track for cleanup
          data?.forEach(user => TestCleanup.trackCreated('users', user.id))
          
          return data
        }
      )

      expect(createdUsers).toHaveLength(TEST_CONFIG.MAX_USERS)
      
      // Performance assertions for real database
      const metrics = tracker.getMetrics()[0]
      expect(metrics.rps).toBeGreaterThan(1) // At least 1 user/second
      expect(metrics.avgLatency).toBeLessThan(5000) // Less than 5 seconds per user
      expect(metrics.errors).toBe(0)
    }, TEST_CONFIG.TIMEOUT)

    it('should read users with pagination performance', async () => {
      // First create test users
      const users = Array.from({ length: 10 }, () => RealTestDataGenerator.generateUser())
      
      const { data: createdUsers } = await supabaseTest
        .from('users')
        .insert(users)
        .select('id')
      
      createdUsers?.forEach(user => TestCleanup.trackCreated('users', user.id))

      // Test reading with pagination
      const readUsers = await tracker.measureOperation(
        'User Reading (Paginated)', 
        10, 
        async () => {
          const { data, error } = await supabaseTest
            .from('users')
            .select('*')
            .limit(10)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data
        }
      )

      expect(readUsers).toHaveLength(10)
      
      const metrics = tracker.getMetrics()[0]
      expect(metrics.rps).toBeGreaterThan(5) // Reading should be faster
      expect(metrics.avgLatency).toBeLessThan(2000) // Less than 2 seconds
    }, TEST_CONFIG.TIMEOUT)
  })

  describe('Order and Bid Operations Performance', () => {
    it('should handle complete order workflow with real latency', async () => {
      // Setup: Create users and items
      const buyers = Array.from({ length: 5 }, () => ({
        ...RealTestDataGenerator.generateUser(),
        role: 'buyer'
      }))
      const sellers = Array.from({ length: 5 }, () => ({
        ...RealTestDataGenerator.generateUser(),
        role: 'seller'
      }))

      const { data: createdBuyers } = await supabaseTest
        .from('users')
        .insert(buyers)
        .select('id')

      const { data: createdSellers } = await supabaseTest
        .from('users')
        .insert(sellers)
        .select('id')

      createdBuyers?.forEach(user => TestCleanup.trackCreated('users', user.id))
      createdSellers?.forEach(user => TestCleanup.trackCreated('users', user.id))

      // Create items
      const items = createdSellers!.map(seller => 
        RealTestDataGenerator.generateItem(seller.id)
      )

      const { data: createdItems } = await supabaseTest
        .from('items')
        .insert(items)
        .select('id')

      createdItems?.forEach(item => TestCleanup.trackCreated('items', item.id))

      // Test order creation performance
      const orders = createdBuyers!.slice(0, TEST_CONFIG.MAX_ORDERS).map((buyer, index) => 
        RealTestDataGenerator.generateOrder(buyer.id, createdItems![index % createdItems!.length].id)
      )

      const createdOrders = await tracker.measureOperation(
        'Order Creation with International/Domestic Logic', 
        orders.length, 
        async () => {
          const { data, error } = await supabaseTest
            .from('orders')
            .insert(orders)
            .select('id')

          if (error) throw error
          
          data?.forEach(order => TestCleanup.trackCreated('orders', order.id))
          return data
        }
      )

      // Test bid creation performance
      const bids: any[] = []
      createdOrders!.forEach(order => {
        for (let i = 0; i < TEST_CONFIG.MAX_BIDS_PER_ORDER; i++) {
          const randomSeller = createdSellers![i % createdSellers!.length]
          bids.push(RealTestDataGenerator.generateBid(order.id, randomSeller.id))
        }
      })

      const createdBids = await tracker.measureOperation(
        'Seller Bid Creation', 
        bids.length, 
        async () => {
          const { data, error } = await supabaseTest
            .from('bids')
            .insert(bids)
            .select('id')

          if (error) throw error
          
          data?.forEach(bid => TestCleanup.trackCreated('bids', bid.id))
          return data
        }
      )

      // Performance assertions
      expect(createdOrders).toHaveLength(TEST_CONFIG.MAX_ORDERS)
      expect(createdBids).toHaveLength(bids.length)
      
      const orderMetrics = tracker.getMetrics().find(m => m.operation.includes('Order'))!
      const bidMetrics = tracker.getMetrics().find(m => m.operation.includes('Bid'))!
      
      expect(orderMetrics.rps).toBeGreaterThan(2) // At least 2 orders/second
      expect(bidMetrics.rps).toBeGreaterThan(5) // At least 5 bids/second
      expect(orderMetrics.errors + bidMetrics.errors).toBe(0)

    }, TEST_CONFIG.TIMEOUT * 2) // Double timeout for complex workflow
  })

  describe('Concurrent Operations Performance', () => {
    it('should handle concurrent bid submissions', async () => {
      // Setup
      const seller = { ...RealTestDataGenerator.generateUser(), role: 'seller' }
      const buyer = { ...RealTestDataGenerator.generateUser(), role: 'buyer' }
      
      const { data: createdUsers } = await supabaseTest
        .from('users')
        .insert([seller, buyer])
        .select('id')
      
      createdUsers?.forEach(user => TestCleanup.trackCreated('users', user.id))
      
      const item = RealTestDataGenerator.generateItem(createdUsers![0].id)
      const { data: createdItems } = await supabaseTest
        .from('items')
        .insert([item])
        .select('id')
      
      createdItems?.forEach(item => TestCleanup.trackCreated('items', item.id))
      
      const order = RealTestDataGenerator.generateOrder(createdUsers![1].id, createdItems![0].id)
      const { data: createdOrders } = await supabaseTest
        .from('orders')
        .insert([order])
        .select('id')
      
      createdOrders?.forEach(order => TestCleanup.trackCreated('orders', order.id))

      // Test concurrent bid submissions
      const concurrentBids = Array.from({ length: 10 }, () => 
        RealTestDataGenerator.generateBid(createdOrders![0].id, createdUsers![0].id)
      )

      const results = await tracker.measureOperation(
        'Concurrent Bid Submissions', 
        concurrentBids.length, 
        async () => {
          const promises = concurrentBids.map(bid => 
            supabaseTest.from('bids').insert([bid]).select('id')
          )
          
          const results = await Promise.allSettled(promises)
          
          // Track successful submissions for cleanup
          results.forEach(result => {
            if (result.status === 'fulfilled' && result.value.data) {
              result.value.data.forEach((bid: any) => TestCleanup.trackCreated('bids', bid.id))
            }
          })
          
          return results
        }
      )

      const successfulResults = results.filter(r => r.status === 'fulfilled')
      expect(successfulResults.length).toBeGreaterThan(0)
      
      const metrics = tracker.getMetrics()[0]
      expect(metrics.rps).toBeGreaterThan(3) // At least 3 concurrent operations/second

    }, TEST_CONFIG.TIMEOUT)
  })

  describe('Error Handling and Recovery', () => {
    it('should handle database constraint violations gracefully', async () => {
      const invalidOrder = {
        buyer_id: 'non-existent-buyer-id',
        item_id: 'non-existent-item-id',
        quantity: 10,
        status: 'pending'
      }

      await tracker.measureOperation(
        'Invalid Order Creation (Error Handling)', 
        1, 
        async () => {
          const { data, error } = await supabaseTest
            .from('orders')
            .insert([invalidOrder])
            .select('id')

          // This should fail due to foreign key constraints
          expect(error).toBeTruthy()
          expect(data).toBeFalsy()
          
          return { error }
        }
      )

      const metrics = tracker.getMetrics()[0]
      expect(metrics.errors).toBe(0) // No errors in our test handling
      expect(metrics.avgLatency).toBeLessThan(3000) // Quick error response

    }, TEST_CONFIG.TIMEOUT)
  })
})

// Helper script to setup test environment
export const setupTestEnvironment = async (): Promise<void> => {
  console.log('🔧 Setting up Supabase test environment...')
  console.log('Make sure you have:')
  console.log('1. A separate Supabase test project')
  console.log('2. SUPABASE_TEST_URL environment variable')
  console.log('3. SUPABASE_TEST_ANON_KEY environment variable')
  console.log('4. Database tables created with proper schemas')
}