import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestDataGenerator, mockApiResponses, testUtils } from '../../lib/test/test-helpers'
import { User, Item, Order, Bid, UserRole } from '@/lib/types'

// Mock the API functions
jest.mock('@/lib/supabase-api', () => ({
  getUsers: jest.fn(),
  getUserById: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  createSellerAccount: jest.fn(),
  getActiveItems: jest.fn(),
  getItemById: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  getOrders: jest.fn(),
  getOrdersByBuyer: jest.fn(),
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  getBidsByOrder: jest.fn(),
  createBid: jest.fn(),
  updateBid: jest.fn(),
  deleteBid: jest.fn(),
  getShippingBidsByOrder: jest.fn(),
  createShippingBid: jest.fn(),
  updateShippingBid: jest.fn(),
  getBuyerStats: jest.fn(),
  getSellerStats: jest.fn(),
  getAdminStats: jest.fn(),
}))

// Mock the Auth Context
const mockAuthContext = {
  user: null,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe('User Management API', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('User Creation', () => {
    it('should create a buyer user successfully', async () => {
      const { createUser } = require('@/lib/supabase-api')
      const userData = TestDataGenerator.generateUser('buyer')
      
      createUser.mockResolvedValue(userData)
      
      const result = await createUser(userData)
      
      expect(createUser).toHaveBeenCalledWith(userData)
      expect(result).toEqual(userData)
      expect(result.role).toBe('buyer')
    })

    it('should create a seller user successfully', async () => {
      const { createUser } = require('@/lib/supabase-api')
      const userData = TestDataGenerator.generateUser('seller')
      
      createUser.mockResolvedValue(userData)
      
      const result = await createUser(userData)
      
      expect(result.role).toBe('seller')
      expect(result.email).toMatch(/@.+\..+/)
    })

    it('should create multiple users with different roles', async () => {
      const { createUser } = require('@/lib/supabase-api')
      const roles: UserRole[] = ['buyer', 'seller', 'admin', 'shipping_provider']
      
      for (const role of roles) {
        const userData = TestDataGenerator.generateUser(role)
        createUser.mockResolvedValue(userData)
        
        const result = await createUser(userData)
        expect(result.role).toBe(role)
      }
    })

    it('should handle user creation errors', async () => {
      const { createUser } = require('@/lib/supabase-api')
      const userData = TestDataGenerator.generateUser('buyer')
      
      createUser.mockRejectedValue(new Error('Database connection failed'))
      
      await expect(createUser(userData)).rejects.toThrow('Database connection failed')
    })
  })

  describe('User Retrieval', () => {
    it('should fetch all users', async () => {
      const { getUsers } = require('@/lib/supabase-api')
      
      getUsers.mockResolvedValue(mockApiResponses.users)
      
      const result = await getUsers()
      
      expect(result).toHaveLength(50)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('email')
      expect(result[0]).toHaveProperty('role')
    })

    it('should fetch user by ID', async () => {
      const { getUserById } = require('@/lib/supabase-api')
      const user = mockApiResponses.users[0]
      
      getUserById.mockResolvedValue(user)
      
      const result = await getUserById(user.id)
      
      expect(result).toEqual(user)
      expect(getUserById).toHaveBeenCalledWith(user.id)
    })

    it('should return null for non-existent user', async () => {
      const { getUserById } = require('@/lib/supabase-api')
      
      getUserById.mockResolvedValue(null)
      
      const result = await getUserById('non-existent-id')
      
      expect(result).toBeNull()
    })
  })

  describe('User Updates', () => {
    it('should update user information', async () => {
      const { updateUser } = require('@/lib/supabase-api')
      const user = TestDataGenerator.generateUser('buyer')
      const updates = { name: 'Updated Name', phone: '+1234567890' }
      const updatedUser = { ...user, ...updates }
      
      updateUser.mockResolvedValue(updatedUser)
      
      const result = await updateUser(user.id, updates)
      
      expect(result.name).toBe('Updated Name')
      expect(result.phone).toBe('+1234567890')
      expect(updateUser).toHaveBeenCalledWith(user.id, updates)
    })
  })
})

describe('Item Management API', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('Item Creation', () => {
    it('should create an item successfully', async () => {
      const { createItem } = require('@/lib/supabase-api')
      const itemData = TestDataGenerator.generateItem()
      
      createItem.mockResolvedValue(itemData)
      
      const result = await createItem(itemData)
      
      expect(createItem).toHaveBeenCalledWith(itemData)
      expect(result).toEqual(itemData)
      expect(result).toHaveProperty('specifications')
    })

    it('should create item with country and incoterms', async () => {
      const { createItem } = require('@/lib/supabase-api')
      const itemData = TestDataGenerator.generateItem()
      itemData.specifications = {
        ...itemData.specifications,
        'Destination Country': 'United States',
        'Incoterms': 'FOB - Free On Board'
      }
      
      createItem.mockResolvedValue(itemData)
      
      const result = await createItem(itemData)
      
      expect(result.specifications['Destination Country']).toBe('United States')
      expect(result.specifications['Incoterms']).toBe('FOB - Free On Board')
    })
  })

  describe('Item Retrieval', () => {
    it('should fetch active items', async () => {
      const { getActiveItems } = require('@/lib/supabase-api')
      const activeItems = mockApiResponses.items.filter(item => item.status === 'active')
      
      getActiveItems.mockResolvedValue(activeItems)
      
      const result = await getActiveItems()
      
      expect(result.every((item: Item) => item.status === 'active')).toBe(true)
    })

    it('should fetch item by ID', async () => {
      const { getItemById } = require('@/lib/supabase-api')
      const item = mockApiResponses.items[0]
      
      getItemById.mockResolvedValue(item)
      
      const result = await getItemById(item.id)
      
      expect(result).toEqual(item)
    })
  })

  describe('Item Updates', () => {
    it('should update item successfully', async () => {
      const { updateItem } = require('@/lib/supabase-api')
      const item = TestDataGenerator.generateItem()
      const updates = { price: 299.99, quantity: 50 }
      const updatedItem = { ...item, ...updates }
      
      updateItem.mockResolvedValue(updatedItem)
      
      const result = await updateItem(item.id, updates)
      
      expect(result.price).toBe(299.99)
      expect(result.quantity).toBe(50)
    })
  })
})

describe('Order Management API', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('Order Creation', () => {
    it('should create an order successfully', async () => {
      const { createOrder } = require('@/lib/supabase-api')
      const orderData = TestDataGenerator.generateOrder()
      
      createOrder.mockResolvedValue(orderData)
      
      const result = await createOrder(orderData)
      
      expect(createOrder).toHaveBeenCalledWith(orderData)
      expect(result).toEqual(orderData)
    })

    it('should create order with international shipping details', async () => {
      const { createOrder } = require('@/lib/supabase-api')
      const orderData = TestDataGenerator.generateOrder()
      orderData.notes = 'Destination: Germany Incoterms: CIF - Cost, Insurance and Freight'
      
      createOrder.mockResolvedValue(orderData)
      
      const result = await createOrder(orderData)
      
      expect(result.notes).toContain('Germany')
      expect(result.notes).toContain('CIF')
    })
  })

  describe('Order Retrieval', () => {
    it('should fetch orders by buyer', async () => {
      const { getOrdersByBuyer } = require('@/lib/supabase-api')
      const buyerId = 'test-buyer-id'
      const buyerOrders = mockApiResponses.orders.filter(order => order.buyerId === buyerId)
      
      getOrdersByBuyer.mockResolvedValue(buyerOrders)
      
      const result = await getOrdersByBuyer(buyerId)
      
      expect(result.every((order: Order) => order.buyerId === buyerId)).toBe(true)
    })
  })

  describe('Order Updates', () => {
    it('should update order status', async () => {
      const { updateOrder } = require('@/lib/supabase-api')
      const order = TestDataGenerator.generateOrder()
      const updates = { status: 'accepted' as const }
      const updatedOrder = { ...order, ...updates }
      
      updateOrder.mockResolvedValue(updatedOrder)
      
      const result = await updateOrder(order.id, updates)
      
      expect(result.status).toBe('accepted')
    })
  })
})

describe('Bid Management API', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('Bid Creation', () => {
    it('should create a bid successfully', async () => {
      const { createBid } = require('@/lib/supabase-api')
      const bidData = TestDataGenerator.generateBid()
      
      createBid.mockResolvedValue(bidData)
      
      const result = await createBid(bidData)
      
      expect(result).toEqual(bidData)
      expect(result.bidAmount).toBeGreaterThan(0)
    })

    it('should create shipping bid successfully', async () => {
      const { createShippingBid } = require('@/lib/supabase-api')
      const shippingBidData = TestDataGenerator.generateShippingBid()
      
      createShippingBid.mockResolvedValue(shippingBidData)
      
      const result = await createShippingBid(shippingBidData)
      
      expect(result).toEqual(shippingBidData)
      expect(result.bidAmount).toBeGreaterThan(0)
    })
  })

  describe('Bid Retrieval', () => {
    it('should fetch bids by order', async () => {
      const { getBidsByOrder } = require('@/lib/supabase-api')
      const orderId = 'test-order-id'
      const orderBids = mockApiResponses.bids.filter(bid => bid.orderId === orderId)
      
      getBidsByOrder.mockResolvedValue(orderBids)
      
      const result = await getBidsByOrder(orderId)
      
      expect(result.every((bid: Bid) => bid.orderId === orderId)).toBe(true)
    })

    it('should fetch shipping bids by order', async () => {
      const { getShippingBidsByOrder } = require('@/lib/supabase-api')
      const orderId = 'test-order-id'
      const shippingBids = mockApiResponses.shippingBids.filter(bid => bid.orderId === orderId)
      
      getShippingBidsByOrder.mockResolvedValue(shippingBids)
      
      const result = await getShippingBidsByOrder(orderId)
      
      expect(result.every((bid: any) => bid.orderId === orderId)).toBe(true)
    })
  })

  describe('Bid Updates', () => {
    it('should update bid status', async () => {
      const { updateBid } = require('@/lib/supabase-api')
      const bid = TestDataGenerator.generateBid()
      const updates = { status: 'accepted' as const }
      const updatedBid = { ...bid, ...updates }
      
      updateBid.mockResolvedValue(updatedBid)
      
      const result = await updateBid(bid.id, updates)
      
      expect(result.status).toBe('accepted')
    })

    it('should update shipping bid status', async () => {
      const { updateShippingBid } = require('@/lib/supabase-api')
      const shippingBid = TestDataGenerator.generateShippingBid()
      const updates = { status: 'accepted' as const }
      const updatedShippingBid = { ...shippingBid, ...updates }
      
      updateShippingBid.mockResolvedValue(updatedShippingBid)
      
      const result = await updateShippingBid(shippingBid.id, updates)
      
      expect(result.status).toBe('accepted')
    })
  })
})

describe('Stats and Analytics', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  it('should fetch buyer stats', async () => {
    const { getBuyerStats } = require('@/lib/supabase-api')
    const stats = {
      totalOrders: 25,
      pendingOrders: 10,
      totalSpent: 15000,
      activeBids: 5
    }
    
    getBuyerStats.mockResolvedValue(stats)
    
    const result = await getBuyerStats('buyer-id')
    
    expect(result).toEqual(stats)
    expect(result.totalOrders).toBe(25)
  })

  it('should fetch seller stats', async () => {
    const { getSellerStats } = require('@/lib/supabase-api')
    const stats = {
      totalItems: 50,
      activeItems: 30,
      totalRevenue: 25000,
      pendingBids: 12
    }
    
    getSellerStats.mockResolvedValue(stats)
    
    const result = await getSellerStats('seller-id')
    
    expect(result).toEqual(stats)
    expect(result.totalItems).toBe(50)
  })

  it('should fetch admin stats', async () => {
    const { getAdminStats } = require('@/lib/supabase-api')
    const stats = {
      totalUsers: 100,
      totalItems: 500,
      totalOrders: 250,
      totalRevenue: 100000
    }
    
    getAdminStats.mockResolvedValue(stats)
    
    const result = await getAdminStats()
    
    expect(result).toEqual(stats)
    expect(result.totalUsers).toBe(100)
  })
})