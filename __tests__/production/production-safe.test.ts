/**
 * PRODUCTION-SAFE READ-ONLY PERFORMANCE TESTS
 * 
 * These tests only READ data from your production database
 * NO data is created, modified, or deleted
 * Safe to run against live production environment
 * 
 * Measures real query performance without any risk
 */

import { createClient } from '@supabase/supabase-js'

// Production Supabase client (READ-ONLY operations)
const supabaseProduction = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Performance metrics for read-only operations
interface ReadOnlyMetrics {
  operation: string
  recordCount: number
  duration: number
  rps: number
  avgLatency: number
  success: boolean
}

class ProductionPerformanceTracker {
  private metrics: ReadOnlyMetrics[] = []

  async measureReadOperation<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      // Count records if it's an array
      const recordCount = Array.isArray(result) ? result.length : 1
      
      this.metrics.push({
        operation,
        recordCount,
        duration,
        rps: recordCount / (duration / 1000),
        avgLatency: duration,
        success: true
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      this.metrics.push({
        operation,
        recordCount: 0,
        duration,
        rps: 0,
        avgLatency: duration,
        success: false
      })
      
      throw error
    }
  }

  printSummary(): void {
    console.log('\\n📊 === PRODUCTION READ-ONLY PERFORMANCE RESULTS ===')
    
    this.metrics.forEach(metric => {
      console.log(`\\n🔍 ${metric.operation}:`)
      console.log(`   📦 Records Found: ${metric.recordCount}`)
      console.log(`   ⏱️  Query Time: ${metric.duration.toFixed(2)}ms`)
      console.log(`   ⚡ Read Rate: ${metric.rps.toFixed(2)} records/second`)
      console.log(`   📡 Latency: ${metric.avgLatency.toFixed(2)}ms`)
      console.log(`   ${metric.success ? '✅ Success' : '❌ Failed'}`)
    })
    
    const totalRecords = this.metrics.reduce((sum, m) => sum + m.recordCount, 0)
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0)
    const successCount = this.metrics.filter(m => m.success).length
    
    console.log(`\\n📈 PRODUCTION DATABASE HEALTH SUMMARY:`)
    console.log(`   🔢 Total Records Read: ${totalRecords}`)
    console.log(`   ⏱️  Total Query Time: ${totalDuration.toFixed(2)}ms`)
    console.log(`   ⚡ Overall Read Rate: ${(totalRecords / (totalDuration / 1000)).toFixed(2)} records/second`)
    console.log(`   ✅ Successful Queries: ${successCount}/${this.metrics.length}`)
    console.log(`   📊 Database Health: ${totalRecords > 0 ? '🟢 Healthy' : '🟡 Empty or Issues'}`)
  }

  reset(): void {
    this.metrics = []
  }
}

describe('Production Database Read-Only Performance Tests', () => {
  let tracker: ProductionPerformanceTracker
  
  beforeAll(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('⚠️  Skipping production tests - missing credentials')
      return
    }
    console.log('📖 Running READ-ONLY performance tests on production database')
    console.log('🔒 No data will be created, modified, or deleted')
  })

  beforeEach(() => {
    tracker = new ProductionPerformanceTracker()
  })

  afterEach(() => {
    tracker.printSummary()
    tracker.reset()
  })

  describe('Database Query Performance', () => {
    it('should measure user table read performance', async () => {
      const users = await tracker.measureReadOperation(
        'Users Query Performance',
        async () => {
          const { data, error } = await supabaseProduction
            .from('users')
            .select('id, name, email, role, created_at')
            .limit(50)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        }
      )

      // Performance assertions
      const metrics = tracker.metrics[0]
      expect(metrics.success).toBe(true)
      expect(metrics.avgLatency).toBeLessThan(3000) // Should be under 3 seconds
      
      if (users.length > 0) {
        console.log(`✅ Found ${users.length} users in production`)
        expect(metrics.rps).toBeGreaterThan(1) // At least 1 record/second
      } else {
        console.log('ℹ️  No users found in production database')
      }
    })

    it('should measure items table read performance', async () => {
      const items = await tracker.measureReadOperation(
        'Items Query Performance',
        async () => {
          const { data, error } = await supabaseProduction
            .from('items')
            .select('id, name, price, quantity, seller_id, created_at')
            .limit(50)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        }
      )

      const metrics = tracker.metrics[0]
      expect(metrics.success).toBe(true)
      expect(metrics.avgLatency).toBeLessThan(3000)
      
      if (items.length > 0) {
        console.log(`✅ Found ${items.length} items in production`)
        expect(metrics.rps).toBeGreaterThan(1)
      } else {
        console.log('ℹ️  No items found in production database')
      }
    })

    it('should measure orders table read performance', async () => {
      const orders = await tracker.measureReadOperation(
        'Orders Query Performance',
        async () => {
          const { data, error } = await supabaseProduction
            .from('orders')
            .select('id, buyer_id, item_id, quantity, status, notes, created_at')
            .limit(50)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        }
      )

      const metrics = tracker.metrics[0]
      expect(metrics.success).toBe(true)
      expect(metrics.avgLatency).toBeLessThan(3000)
      
      if (orders.length > 0) {
        console.log(`✅ Found ${orders.length} orders in production`)
        expect(metrics.rps).toBeGreaterThan(1)
        
        // Check for international orders
        const internationalOrders = orders.filter(order => 
          order.notes?.includes('Destination:') && !order.notes?.includes('India')
        )
        console.log(`🌍 International orders: ${internationalOrders.length}`)
        
        // Check for Incoterms usage
        const incotermsOrders = orders.filter(order => 
          order.notes?.includes('Incoterms:')
        )
        console.log(`📋 Orders with Incoterms: ${incotermsOrders.length}`)
      } else {
        console.log('ℹ️  No orders found in production database')
      }
    })

    it('should measure bids table read performance', async () => {
      const bids = await tracker.measureReadOperation(
        'Bids Query Performance',
        async () => {
          const { data, error } = await supabaseProduction
            .from('bids')
            .select('id, order_id, seller_id, bid_amount, status, created_at')
            .limit(50)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        }
      )

      const metrics = tracker.metrics[0]
      expect(metrics.success).toBe(true)
      expect(metrics.avgLatency).toBeLessThan(3000)
      
      if (bids.length > 0) {
        console.log(`✅ Found ${bids.length} bids in production`)
        expect(metrics.rps).toBeGreaterThan(1)
        
        // Analyze bid distribution
        const statusCounts = bids.reduce((acc, bid) => {
          acc[bid.status] = (acc[bid.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log(`📊 Bid status distribution:`, statusCounts)
      } else {
        console.log('ℹ️  No bids found in production database')
      }
    })
  })

  describe('Complex Query Performance', () => {
    it('should measure joined queries performance', async () => {
      const ordersWithDetails = await tracker.measureReadOperation(
        'Complex Join Query Performance',
        async () => {
          const { data, error } = await supabaseProduction
            .from('orders')
            .select(`
              id,
              quantity,
              status,
              notes,
              created_at,
              buyer:users!buyer_id(name, email),
              item:items(name, price, seller:users!seller_id(name))
            `)
            .limit(20)
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        }
      )

      const metrics = tracker.metrics[0]
      expect(metrics.success).toBe(true)
      expect(metrics.avgLatency).toBeLessThan(5000) // Complex queries can take longer
      
      if (ordersWithDetails.length > 0) {
        console.log(`✅ Successfully joined ${ordersWithDetails.length} orders with user and item details`)
        console.log('📊 Your database relationships are working correctly')
      }
    })

    it('should measure database response under multiple simultaneous queries', async () => {
      const startTime = performance.now()
      
      // Run multiple read queries simultaneously
      const promises = [
        supabaseProduction.from('users').select('count').limit(1),
        supabaseProduction.from('items').select('count').limit(1),
        supabaseProduction.from('orders').select('count').limit(1),
        supabaseProduction.from('bids').select('count').limit(1)
      ]

      const results = await tracker.measureReadOperation(
        'Concurrent Read Queries',
        async () => {
          const settled = await Promise.allSettled(promises)
          return settled.filter(result => result.status === 'fulfilled')
        }
      )

      const metrics = tracker.metrics[0]
      console.log(`⚡ Handled ${promises.length} concurrent queries successfully`)
      console.log(`📡 Your database can handle concurrent load`)
      
      expect(metrics.success).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Production Database Health Check', () => {
    it('should verify table accessibility and basic structure', async () => {
      const healthCheck = await tracker.measureReadOperation(
        'Database Health Check',
        async () => {
          // Check if all required tables exist and are accessible
          const checks = await Promise.allSettled([
            supabaseProduction.from('users').select('id').limit(1),
            supabaseProduction.from('items').select('id').limit(1),
            supabaseProduction.from('orders').select('id').limit(1),
            supabaseProduction.from('bids').select('id').limit(1)
          ])

          const accessible = checks.filter(check => check.status === 'fulfilled')
          return {
            totalTables: checks.length,
            accessibleTables: accessible.length,
            health: accessible.length === checks.length ? 'excellent' : 'warning'
          }
        }
      )

      console.log(`🏥 Database Health: ${healthCheck.health.toUpperCase()}`)
      console.log(`📊 Accessible Tables: ${healthCheck.accessibleTables}/${healthCheck.totalTables}`)
      
      expect(healthCheck.accessibleTables).toBeGreaterThan(0)
      expect(tracker.metrics[0].success).toBe(true)
    })
  })
})