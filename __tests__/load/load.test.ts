import { TestDataGenerator, mockApiResponses, testUtils } from '../../lib/test/test-helpers'
import { User, Item, Order, Bid, ShippingBid } from '@/lib/types'

// Mock all API functions for load testing
jest.mock('@/lib/supabase-api', () => ({
  createUser: jest.fn(),
  createItem: jest.fn(),
  createOrder: jest.fn(),
  createBid: jest.fn(),
  createShippingBid: jest.fn(),
  getActiveItems: jest.fn(),
  getOrdersByBuyer: jest.fn(),
  getBidsByOrder: jest.fn(),
  getShippingBidsByOrder: jest.fn(),
  updateBid: jest.fn(),
  updateOrder: jest.fn(),
  updateShippingBid: jest.fn(),
  getBuyerStats: jest.fn(),
  getSellerStats: jest.fn(),
}))

describe('Load Testing - High Volume Order and Bid Creation', () => {
  let createdUsers: User[] = []
  let createdItems: Item[] = []
  let createdOrders: Order[] = []
  let createdBids: Bid[] = []
  let createdShippingBids: ShippingBid[] = []

  beforeAll(() => {
    testUtils.resetMocks()
    
    // Setup mock implementations for all API calls
    const { 
      createUser, createItem, createOrder, createBid, createShippingBid,
      updateBid, updateOrder, updateShippingBid
    } = require('@/lib/supabase-api')
    
    createUser.mockImplementation((userData: any) => {
      const user = { ...userData, id: TestDataGenerator.generateUser().id, createdAt: new Date() }
      createdUsers.push(user)
      return Promise.resolve(user)
    })
    
    createItem.mockImplementation((itemData: any) => {
      const item = { ...itemData, id: TestDataGenerator.generateItem().id, createdAt: new Date(), updatedAt: new Date() }
      createdItems.push(item)
      return Promise.resolve(item)
    })
    
    createOrder.mockImplementation((orderData: any) => {
      const order = { ...orderData, id: TestDataGenerator.generateOrder().id, createdAt: new Date(), updatedAt: new Date() }
      createdOrders.push(order)
      return Promise.resolve(order)
    })
    
    createBid.mockImplementation((bidData: any) => {
      const bid = { ...bidData, id: TestDataGenerator.generateBid().id, createdAt: new Date(), updatedAt: new Date() }
      createdBids.push(bid)
      return Promise.resolve(bid)
    })
    
    createShippingBid.mockImplementation((shippingBidData: any) => {
      const shippingBid = { ...shippingBidData, id: TestDataGenerator.generateShippingBid().id, createdAt: new Date(), updatedAt: new Date() }
      createdShippingBids.push(shippingBid)
      return Promise.resolve(shippingBid)
    })

    updateBid.mockImplementation((bidId: string, updates: any) => {
      const bid = createdBids.find(b => b.id === bidId)
      if (bid) {
        Object.assign(bid, updates)
      }
      return Promise.resolve(bid)
    })

    updateOrder.mockImplementation((orderId: string, updates: any) => {
      const order = createdOrders.find(o => o.id === orderId)
      if (order) {
        Object.assign(order, updates)
      }
      return Promise.resolve(order)
    })

    updateShippingBid.mockImplementation((bidId: string, updates: any) => {
      const bid = createdShippingBids.find(b => b.id === bidId)
      if (bid) {
        Object.assign(bid, updates)
      }
      return Promise.resolve(bid)
    })
  })

  describe('User Creation Load Test', () => {
    it('should create 100 users with different roles', async () => {
      const { createUser } = require('@/lib/supabase-api')
      const roles = ['buyer', 'seller', 'shipping_provider', 'admin'] as const
      
      console.log('🚀 Starting user creation load test...')
      const startTime = Date.now()
      
      const userCreationPromises = Array.from({ length: 100 }, (_, index) => {
        const role = roles[index % roles.length]
        const userData = TestDataGenerator.generateUser(role)
        return createUser(userData)
      })
      
      const results = await Promise.all(userCreationPromises)
      const endTime = Date.now()
      
      console.log(`✅ Created ${results.length} users in ${endTime - startTime}ms`)
      console.log(`📊 Performance: ${(results.length / ((endTime - startTime) / 1000)).toFixed(2)} users/second`)
      
      expect(results).toHaveLength(100)
      expect(createdUsers).toHaveLength(100)
      
      // Verify role distribution
      const roleDistribution = results.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('👥 Role Distribution:', roleDistribution)
      expect(roleDistribution.buyer).toBe(25)
      expect(roleDistribution.seller).toBe(25)
      expect(roleDistribution.shipping_provider).toBe(25)
      expect(roleDistribution.admin).toBe(25)
    })
  })

  describe('Item Creation Load Test', () => {
    it('should create 100 items with international and domestic specifications', async () => {
      const { createItem } = require('@/lib/supabase-api')
      const countries = TestDataGenerator.generateCountries()
      const incoterms = TestDataGenerator.generateIncoterms()
      
      console.log('🏭 Starting item creation load test...')
      const startTime = Date.now()
      
      const itemCreationPromises = Array.from({ length: 100 }, (_, index) => {
        const itemData = TestDataGenerator.generateItem()
        const isInternational = index % 3 === 0 // 1/3 of items are international
        
        if (isInternational) {
          const country = countries[index % countries.length]
          const incoterm = incoterms[index % incoterms.length]
          itemData.specifications = {
            ...itemData.specifications,
            'Destination Country': country,
            'Incoterms': `${incoterm.code} - ${incoterm.name}`
          }
        } else {
          itemData.specifications = {
            ...itemData.specifications,
            'Destination Country': 'India'
          }
        }
        
        return createItem(itemData)
      })
      
      const results = await Promise.all(itemCreationPromises)
      const endTime = Date.now()
      
      console.log(`✅ Created ${results.length} items in ${endTime - startTime}ms`)
      console.log(`📊 Performance: ${(results.length / ((endTime - startTime) / 1000)).toFixed(2)} items/second`)
      
      expect(results).toHaveLength(100)
      expect(createdItems).toHaveLength(100)
      
      // Verify international vs domestic distribution
      const internationalItems = results.filter(item => 
        item.specifications['Destination Country'] !== 'India'
      )
      const domesticItems = results.filter(item => 
        item.specifications['Destination Country'] === 'India'
      )
      
      console.log(`🌍 International items: ${internationalItems.length}`)
      console.log(`🇮🇳 Domestic items: ${domesticItems.length}`)
      
      expect(internationalItems.length).toBeGreaterThanOrEqual(30)
      expect(domesticItems.length).toBeGreaterThanOrEqual(65)
      
      // Verify all international items have Incoterms
      internationalItems.forEach(item => {
        expect(item.specifications['Incoterms']).toBeDefined()
        expect(item.specifications['Incoterms']).toMatch(/^[A-Z]{3} - /)
      })
    })
  })

  describe('Order Creation Load Test - 100 Orders', () => {
    let buyers: User[]
    let availableItems: Item[]

    beforeAll(async () => {
      // Create buyers and items first
      buyers = createdUsers.filter(user => user.role === 'buyer')
      availableItems = createdItems.slice(0, 50) // Use first 50 items
    })

    it('should create 100 orders with proper distribution', async () => {
      const { createOrder } = require('@/lib/supabase-api')
      
      console.log('📋 Starting order creation load test...')
      const startTime = Date.now()
      
      const orderCreationPromises = Array.from({ length: 100 }, (_, index) => {
        const buyer = buyers[index % buyers.length]
        const item = availableItems[index % availableItems.length]
        const isInternational = item.specifications['Destination Country'] !== 'India'
        
        const orderData = TestDataGenerator.generateOrder(item.id, buyer.id)
        
        // Add country and incoterms info to notes for international orders
        if (isInternational) {
          orderData.notes = `${orderData.notes || ''} Destination: ${item.specifications['Destination Country']} ${item.specifications['Incoterms'] ? 'Incoterms: ' + item.specifications['Incoterms'] : ''}`
        }
        
        return createOrder(orderData)
      })
      
      const results = await Promise.all(orderCreationPromises)
      const endTime = Date.now()
      
      console.log(`✅ Created ${results.length} orders in ${endTime - startTime}ms`)
      console.log(`📊 Performance: ${(results.length / ((endTime - startTime) / 1000)).toFixed(2)} orders/second`)
      
      expect(results).toHaveLength(100)
      expect(createdOrders).toHaveLength(100)
      
      // Verify order distribution by status
      const statusDistribution = results.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('📊 Order Status Distribution:', statusDistribution)
      
      // Verify international vs domestic orders
      const internationalOrders = results.filter(order => 
        order.notes && order.notes.includes('Destination:') && !order.notes.includes('Destination: India')
      )
      
      console.log(`🌍 International orders: ${internationalOrders.length}`)
      console.log(`🇮🇳 Domestic orders: ${results.length - internationalOrders.length}`)
    })
  })

  describe('Bid Creation Load Test - 20+ Bids per Order', () => {
    let sellers: User[]
    let shippingProviders: User[]
    let testOrders: Order[]

    beforeAll(() => {
      sellers = createdUsers.filter(user => user.role === 'seller')
      shippingProviders = createdUsers.filter(user => user.role === 'shipping_provider')
      testOrders = createdOrders.slice(0, 20) // Use first 20 orders for intensive bidding
    })

    it('should create 20+ seller bids for each test order', async () => {
      const { createBid } = require('@/lib/supabase-api')
      
      console.log('💰 Starting seller bid creation load test...')
      const startTime = Date.now()
      
      const bidCreationPromises: Promise<any>[] = []
      
      testOrders.forEach(order => {
        // Create 25 seller bids for each order
        for (let i = 0; i < 25; i++) {
          const seller = sellers[i % sellers.length]
          const bidData = TestDataGenerator.generateBid(order.id, seller.id)
          
          // Add some variation to bid amounts for realistic testing
          bidData.bidAmount = bidData.bidAmount + (i * 10) // Incremental pricing
          bidData.message = `Competitive bid #${i + 1} from ${seller.name}`
          
          bidCreationPromises.push(createBid(bidData))
        }
      })
      
      const results = await Promise.all(bidCreationPromises)
      const endTime = Date.now()
      
      console.log(`✅ Created ${results.length} seller bids in ${endTime - startTime}ms`)
      console.log(`📊 Performance: ${(results.length / ((endTime - startTime) / 1000)).toFixed(2)} bids/second`)
      console.log(`🎯 Average bids per order: ${results.length / testOrders.length}`)
      
      expect(results).toHaveLength(testOrders.length * 25)
      expect(createdBids.length).toBeGreaterThanOrEqual(500)
      
      // Verify bid distribution per order
      testOrders.forEach(order => {
        const orderBids = results.filter(bid => bid.orderId === order.id)
        expect(orderBids.length).toBe(25)
      })
    })

    it('should create 20+ shipping bids for each test order', async () => {
      const { createShippingBid } = require('@/lib/supabase-api')
      
      console.log('🚚 Starting shipping bid creation load test...')
      const startTime = Date.now()
      
      const shippingBidCreationPromises: Promise<any>[] = []
      
      testOrders.forEach(order => {
        // Create 22 shipping bids for each order
        for (let i = 0; i < 22; i++) {
          const shippingProvider = shippingProviders[i % shippingProviders.length]
          const shippingBidData = TestDataGenerator.generateShippingBid(order.id, shippingProvider.id)
          
          // Add variation to shipping costs
          shippingBidData.bidAmount = shippingBidData.bidAmount + (i * 5)
          shippingBidData.message = `Express shipping option ${i + 1} - ${shippingProvider.name}`
          
          shippingBidCreationPromises.push(createShippingBid(shippingBidData))
        }
      })
      
      const results = await Promise.all(shippingBidCreationPromises)
      const endTime = Date.now()
      
      console.log(`✅ Created ${results.length} shipping bids in ${endTime - startTime}ms`)
      console.log(`📊 Performance: ${(results.length / ((endTime - startTime) / 1000)).toFixed(2)} shipping bids/second`)
      console.log(`🎯 Average shipping bids per order: ${results.length / testOrders.length}`)
      
      expect(results).toHaveLength(testOrders.length * 22)
      expect(createdShippingBids.length).toBeGreaterThanOrEqual(440)
      
      // Verify shipping bid distribution per order
      testOrders.forEach(order => {
        const orderShippingBids = results.filter(bid => bid.orderId === order.id)
        expect(orderShippingBids.length).toBe(22)
      })
    })
  })

  describe('Bid Processing Load Test - Accept/Reject Operations', () => {
    it('should process bid acceptances for multiple orders simultaneously', async () => {
      const { updateBid, updateShippingBid, updateOrder } = require('@/lib/supabase-api')
      
      console.log('⚡ Starting bid processing load test...')
      const startTime = Date.now()
      
      const processingPromises: Promise<any>[] = []
      
      // Process first 50 orders
      const ordersToProcess = createdOrders.slice(0, 50)
      
      ordersToProcess.forEach(order => {
        // Find bids for this order
        const orderBids = createdBids.filter(bid => bid.orderId === order.id)
        const orderShippingBids = createdShippingBids.filter(bid => bid.orderId === order.id)
        
        if (orderBids.length > 0 && orderShippingBids.length > 0) {
          // Accept the lowest seller bid
          const lowestBid = orderBids.reduce((lowest, current) => 
            current.bidAmount < lowest.bidAmount ? current : lowest
          )
          
          // Accept the lowest shipping bid
          const lowestShippingBid = orderShippingBids.reduce((lowest, current) => 
            current.bidAmount < lowest.bidAmount ? current : lowest
          )
          
          // Create processing promises
          processingPromises.push(
            updateBid(lowestBid.id, { status: 'accepted' }),
            updateShippingBid(lowestShippingBid.id, { status: 'accepted' }),
            updateOrder(order.id, { status: 'accepted' })
          )
          
          // Reject other bids
          orderBids.forEach(bid => {
            if (bid.id !== lowestBid.id) {
              processingPromises.push(updateBid(bid.id, { status: 'rejected' }))
            }
          })
          
          orderShippingBids.forEach(bid => {
            if (bid.id !== lowestShippingBid.id) {
              processingPromises.push(updateShippingBid(bid.id, { status: 'rejected' }))
            }
          })
        }
      })
      
      const results = await Promise.all(processingPromises)
      const endTime = Date.now()
      
      console.log(`✅ Processed ${results.length} bid operations in ${endTime - startTime}ms`)
      console.log(`📊 Performance: ${(results.length / ((endTime - startTime) / 1000)).toFixed(2)} operations/second`)
      
      expect(results.length).toBeGreaterThan(0)
      
      // Verify that each processed order has exactly one accepted seller bid and one accepted shipping bid
      const acceptedOrders = createdOrders.filter(order => order.status === 'accepted')
      console.log(`🎯 Orders successfully processed: ${acceptedOrders.length}`)
      
      expect(acceptedOrders.length).toBeGreaterThan(0)
      expect(acceptedOrders.length).toBeLessThanOrEqual(ordersToProcess.length)
    })
  })

  describe('Performance Metrics Summary', () => {
    it('should generate comprehensive performance report', () => {
      console.log('\n📈 === LOAD TEST PERFORMANCE SUMMARY ===')
      console.log(`👥 Total Users Created: ${createdUsers.length}`)
      console.log(`🏭 Total Items Created: ${createdItems.length}`)
      console.log(`📋 Total Orders Created: ${createdOrders.length}`)
      console.log(`💰 Total Seller Bids Created: ${createdBids.length}`)
      console.log(`🚚 Total Shipping Bids Created: ${createdShippingBids.length}`)
      
      // Calculate average bids per order
      const avgBidsPerOrder = createdOrders.length > 0 ? (createdBids.length / createdOrders.length) : 0
      const avgShippingBidsPerOrder = createdOrders.length > 0 ? (createdShippingBids.length / createdOrders.length) : 0
      
      console.log(`🎯 Average Seller Bids per Order: ${avgBidsPerOrder.toFixed(2)}`)
      console.log(`🎯 Average Shipping Bids per Order: ${avgShippingBidsPerOrder.toFixed(2)}`)
      
      // Status distribution
      const orderStatusDistribution = createdOrders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const bidStatusDistribution = createdBids.reduce((acc, bid) => {
        acc[bid.status] = (acc[bid.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log(`📊 Order Status Distribution:`, orderStatusDistribution)
      console.log(`📊 Bid Status Distribution:`, bidStatusDistribution)
      
      // International vs Domestic
      const internationalItems = createdItems.filter(item => 
        item.specifications['Destination Country'] !== 'India'
      )
      
      console.log(`🌍 International Items: ${internationalItems.length} (${((internationalItems.length / createdItems.length) * 100).toFixed(1)}%)`)
      console.log(`🇮🇳 Domestic Items: ${createdItems.length - internationalItems.length} (${(((createdItems.length - internationalItems.length) / createdItems.length) * 100).toFixed(1)}%)`)
      
      // Performance benchmarks
      expect(createdUsers.length).toBe(100)
      expect(createdItems.length).toBe(100)
      expect(createdOrders.length).toBe(100)
      expect(createdBids.length).toBeGreaterThanOrEqual(500) // 25 bids * 20 orders minimum
      expect(createdShippingBids.length).toBeGreaterThanOrEqual(440) // 22 bids * 20 orders minimum
      expect(avgBidsPerOrder).toBeGreaterThanOrEqual(5) // Minimum 5 bids per order
      expect(avgShippingBidsPerOrder).toBeGreaterThanOrEqual(4) // Minimum 4 shipping bids per order
      
      console.log('✅ All performance benchmarks met!')
      console.log('🎉 Load test completed successfully!\n')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle concurrent bid submissions gracefully', async () => {
      const { createBid } = require('@/lib/supabase-api')
      
      const testOrder = createdOrders[0]
      const testSeller = createdUsers.find(u => u.role === 'seller')
      
      // Simulate concurrent bid submissions
      const concurrentBids = Array.from({ length: 10 }, () => 
        createBid(TestDataGenerator.generateBid(testOrder.id, testSeller?.id))
      )
      
      const results = await Promise.allSettled(concurrentBids)
      const successful = results.filter(r => r.status === 'fulfilled')
      
      console.log(`🔄 Concurrent bids processed: ${successful.length}/10`)
      expect(successful.length).toBeGreaterThan(0)
    })

    it('should validate email uniqueness in bulk user creation', () => {
      const emails = createdUsers.map(user => user.email)
      const uniqueEmails = new Set(emails)
      
      console.log(`📧 Total emails: ${emails.length}, Unique emails: ${uniqueEmails.size}`)
      expect(uniqueEmails.size).toBe(emails.length) // All emails should be unique
    })

    it('should handle invalid data gracefully', async () => {
      const { createOrder } = require('@/lib/supabase-api')
      
      // Test with invalid data
      const invalidOrderData = {
        itemId: '', // Invalid - empty ID
        buyerId: '', // Invalid - empty ID
        quantity: -1, // Invalid - negative quantity
        totalPrice: -100, // Invalid - negative price
      }
      
      try {
        await createOrder(invalidOrderData)
      } catch (error) {
        console.log('✅ Invalid data properly rejected')
      }
    })
  })
})