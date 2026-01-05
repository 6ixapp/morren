import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestDataGenerator, mockApiResponses, testUtils } from '../../lib/test/test-helpers'

// Mock the API
jest.mock('@/lib/supabase-api', () => ({
  getOrders: jest.fn(),
  getBidsByOrder: jest.fn(),
  createBid: jest.fn(),
  updateBid: jest.fn(),
  getSellerStats: jest.fn(),
  getItems: jest.fn(),
  createItem: jest.fn(),
  updateItem: jest.fn(),
  deleteItem: jest.fn(),
  createShippingBid: jest.fn(),
}))

// Mock Auth Context
const mockSellerUser = TestDataGenerator.generateUser('seller')
const mockAuthContext = {
  user: mockSellerUser,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('Seller Dashboard Features', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('Order Viewing and Bidding', () => {
    it('should display available orders for bidding', async () => {
      const { getOrders } = require('@/lib/supabase-api')
      const orders = mockApiResponses.orders.filter(order => order.status === 'pending').slice(0, 10)
      
      getOrders.mockResolvedValue(orders)
      
      const OrderList = () => {
        const [ordersList, setOrdersList] = React.useState([])
        
        React.useEffect(() => {
          getOrders().then(setOrdersList)
        }, [])
        
        return (
          <div data-testid="orders-list">
            {ordersList.map((order: any) => (
              <div key={order.id} data-testid="order-card">
                <h3>{order.item?.name || 'Order Item'}</h3>
                <p>Quantity: {order.quantity}</p>
                <p>Status: {order.status}</p>
                <span>{order.shippingAddress}</span>
              </div>
            ))}
          </div>
        )
      }
      
      render(<OrderList />)
      
      await waitFor(() => {
        const orderCards = screen.getAllByTestId('order-card')
        expect(orderCards).toHaveLength(10)
      })
    })

    it('should display international orders with Incoterms information', async () => {
      const { getOrders } = require('@/lib/supabase-api')
      const internationalOrder = TestDataGenerator.generateOrder()
      internationalOrder.notes = 'Destination: Germany Incoterms: CIF - Cost, Insurance and Freight'
      
      getOrders.mockResolvedValue([internationalOrder])
      
      const InternationalOrderDisplay = () => {
        const [orders, setOrders] = React.useState([])
        
        React.useEffect(() => {
          getOrders().then(setOrders)
        }, [])
        
        const order = orders[0]
        const isInternational = order?.notes?.includes('Destination:') && !order?.notes?.includes('India')
        const incoterms = order?.notes?.match(/Incoterms: ([^\\s]+.*?)(?:Additional|$)/)?.[1]
        
        return (
          <div data-testid="international-order">
            {order && (
              <div>
                <h3>Order Details</h3>
                <p data-testid="order-type">
                  {isInternational ? 'International Order' : 'Domestic Order'}
                </p>
                {incoterms && (
                  <p data-testid="incoterms">Incoterms: {incoterms}</p>
                )}
                <p data-testid="notes">{order.notes}</p>
              </div>
            )}
          </div>
        )
      }
      
      render(<InternationalOrderDisplay />)
      
      await waitFor(() => {
        expect(screen.getByTestId('order-type')).toHaveTextContent('International Order')
        expect(screen.getByTestId('incoterms')).toHaveTextContent('CIF - Cost, Insurance and Freight')
        expect(screen.getByTestId('notes')).toHaveTextContent('Germany')
      })
    })

    it('should submit bid for an order', async () => {
      const { createBid } = require('@/lib/supabase-api')
      const order = TestDataGenerator.generateOrder()
      const bidData = TestDataGenerator.generateBid(order.id, mockSellerUser.id)
      
      createBid.mockResolvedValue(bidData)
      
      const BidSubmissionForm = () => {
        const [bidForm, setBidForm] = React.useState({
          bidAmount: '',
          estimatedDelivery: '',
          message: ''
        })
        
        const handleSubmit = async () => {
          const bidPayload = {
            orderId: order.id,
            sellerId: mockSellerUser.id,
            bidAmount: parseFloat(bidForm.bidAmount),
            estimatedDelivery: bidForm.estimatedDelivery,
            message: bidForm.message,
            status: 'pending' as const
          }
          
          await createBid(bidPayload)
        }
        
        return (
          <div>
            <input
              data-testid="bid-amount"
              type="number"
              value={bidForm.bidAmount}
              onChange={(e) => setBidForm(prev => ({ ...prev, bidAmount: e.target.value }))}
              placeholder="Bid Amount"
            />
            <input
              data-testid="delivery-date"
              type="date"
              value={bidForm.estimatedDelivery}
              onChange={(e) => setBidForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
            />
            <textarea
              data-testid="bid-message"
              value={bidForm.message}
              onChange={(e) => setBidForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Message"
            />
            <button data-testid="submit-bid" onClick={handleSubmit}>
              Submit Bid
            </button>
          </div>
        )
      }
      
      render(<BidSubmissionForm />)
      
      await userEvent.type(screen.getByTestId('bid-amount'), '150.50')
      await userEvent.type(screen.getByTestId('delivery-date'), '2024-02-15')
      await userEvent.type(screen.getByTestId('bid-message'), 'Best quality guaranteed')
      
      await userEvent.click(screen.getByTestId('submit-bid'))
      
      await waitFor(() => {
        expect(createBid).toHaveBeenCalledWith({
          orderId: order.id,
          sellerId: mockSellerUser.id,
          bidAmount: 150.50,
          estimatedDelivery: '2024-02-15',
          message: 'Best quality guaranteed',
          status: 'pending'
        })
      })
    })
  })

  describe('Inventory Management', () => {
    it('should display seller inventory', async () => {
      const { getItems } = require('@/lib/supabase-api')
      const sellerItems = [
        TestDataGenerator.generateItem(mockSellerUser.id),
        TestDataGenerator.generateItem(mockSellerUser.id),
        TestDataGenerator.generateItem(mockSellerUser.id),
        TestDataGenerator.generateItem(mockSellerUser.id),
        TestDataGenerator.generateItem(mockSellerUser.id)
      ]
      
      getItems.mockResolvedValue(sellerItems)
      
      const InventoryDisplay = () => {
        const [inventory, setInventory] = React.useState([])
        
        React.useEffect(() => {
          getItems().then(setInventory)
        }, [])
        
        return (
          <div data-testid="inventory-list">
            {inventory.map((item: any) => (
              <div key={item.id} data-testid="inventory-item">
                <h4>{item.name}</h4>
                <p>Price: ${item.price}</p>
                <p>Quantity: {item.quantity}</p>
                <p>Status: {item.status}</p>
              </div>
            ))}
          </div>
        )
      }
      
      render(<InventoryDisplay />)
      
      await waitFor(() => {
        const inventoryItems = screen.getAllByTestId('inventory-item')
        expect(inventoryItems).toHaveLength(5)
      })
    })

    it('should create new inventory item', async () => {
      const { createItem } = require('@/lib/supabase-api')
      const newItem = TestDataGenerator.generateItem(mockSellerUser.id)
      
      createItem.mockResolvedValue(newItem)
      
      const CreateItemForm = () => {
        const [itemForm, setItemForm] = React.useState({
          name: '',
          description: '',
          price: '',
          quantity: '',
          category: ''
        })
        
        const handleSubmit = async () => {
          const itemData = {
            ...itemForm,
            price: parseFloat(itemForm.price),
            quantity: parseInt(itemForm.quantity),
            sellerId: mockSellerUser.id,
            status: 'active' as const,
            condition: 'new' as const,
            specifications: {}
          }
          
          await createItem(itemData)
        }
        
        return (
          <div>
            <input
              data-testid="item-name"
              value={itemForm.name}
              onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Item Name"
            />
            <input
              data-testid="item-price"
              type="number"
              value={itemForm.price}
              onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Price"
            />
            <input
              data-testid="item-quantity"
              type="number"
              value={itemForm.quantity}
              onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder="Quantity"
            />
            <button data-testid="create-item" onClick={handleSubmit}>
              Create Item
            </button>
          </div>
        )
      }
      
      render(<CreateItemForm />)
      
      await userEvent.type(screen.getByTestId('item-name'), 'Premium Cardamom')
      await userEvent.type(screen.getByTestId('item-price'), '299.99')
      await userEvent.type(screen.getByTestId('item-quantity'), '100')
      
      await userEvent.click(screen.getByTestId('create-item'))
      
      await waitFor(() => {
        expect(createItem).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Premium Cardamom',
            price: 299.99,
            quantity: 100,
            sellerId: mockSellerUser.id,
            status: 'active'
          })
        )
      })
    })
  })

  describe('Seller Statistics', () => {
    it('should display seller dashboard stats', async () => {
      const { getSellerStats } = require('@/lib/supabase-api')
      const stats = {
        totalItems: 45,
        activeItems: 32,
        totalRevenue: 15750,
        pendingBids: 18,
        acceptedBids: 25,
        rejectedBids: 8
      }
      
      getSellerStats.mockResolvedValue(stats)
      
      const SellerStatsDisplay = () => {
        const [statsData, setStatsData] = React.useState(null)
        
        React.useEffect(() => {
          getSellerStats(mockSellerUser.id).then(setStatsData)
        }, [])
        
        if (!statsData) return <div>Loading...</div>
        
        return (
          <div data-testid="seller-stats">
            <div data-testid="total-items">Items: {statsData.totalItems}</div>
            <div data-testid="active-items">Active: {statsData.activeItems}</div>
            <div data-testid="total-revenue">Revenue: ${statsData.totalRevenue}</div>
            <div data-testid="pending-bids">Pending Bids: {statsData.pendingBids}</div>
            <div data-testid="accepted-bids">Accepted: {statsData.acceptedBids}</div>
          </div>
        )
      }
      
      render(<SellerStatsDisplay />)
      
      await waitFor(() => {
        expect(screen.getByTestId('total-items')).toHaveTextContent('Items: 45')
        expect(screen.getByTestId('active-items')).toHaveTextContent('Active: 32')
        expect(screen.getByTestId('total-revenue')).toHaveTextContent('Revenue: $15750')
        expect(screen.getByTestId('pending-bids')).toHaveTextContent('Pending Bids: 18')
        expect(screen.getByTestId('accepted-bids')).toHaveTextContent('Accepted: 25')
      })
    })
  })
})

describe('Shipping Provider Dashboard Features', () => {
  const mockShippingProviderUser = TestDataGenerator.generateUser('shipping_provider')
  
  beforeEach(() => {
    testUtils.resetMocks()
    mockAuthContext.user = mockShippingProviderUser
  })

  describe('Shipping Bid Management', () => {
    it('should display available orders for shipping bids', async () => {
      const { getOrders } = require('@/lib/supabase-api')
      const orders = mockApiResponses.orders.filter(order => order.status === 'pending').slice(0, 8)
      
      getOrders.mockResolvedValue(orders)
      
      const ShippingOrdersList = () => {
        const [orders, setOrders] = React.useState([])
        
        React.useEffect(() => {
          getOrders().then(setOrders)
        }, [])
        
        return (
          <div data-testid="shipping-orders">
            {orders.map((order: any) => (
              <div key={order.id} data-testid="shipping-order-card">
                <h4>Order #{order.id.slice(0, 8)}</h4>
                <p>Quantity: {order.quantity}</p>
                <p>Destination: {order.shippingAddress}</p>
                {order.notes?.includes('Incoterms') && (
                  <div data-testid="incoterms-info">
                    International Shipping Required
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }
      
      render(<ShippingOrdersList />)
      
      await waitFor(() => {
        const orderCards = screen.getAllByTestId('shipping-order-card')
        expect(orderCards).toHaveLength(8)
      })
    })

    it('should submit shipping bid with international considerations', async () => {
      const { createShippingBid } = require('@/lib/supabase-api')
      const internationalOrder = TestDataGenerator.generateOrder()
      internationalOrder.notes = 'Destination: Germany Incoterms: CIF - Cost, Insurance and Freight'
      
      const shippingBidData = TestDataGenerator.generateShippingBid(
        internationalOrder.id, 
        mockShippingProviderUser.id
      )
      
      createShippingBid.mockResolvedValue(shippingBidData)
      
      const ShippingBidForm = () => {
        const [bidForm, setBidForm] = React.useState({
          bidAmount: '',
          estimatedDelivery: '',
          message: ''
        })
        
        const isInternational = internationalOrder.notes?.includes('Destination:') && 
                                !internationalOrder.notes?.includes('India')
        
        const handleSubmit = async () => {
          const payload = {
            orderId: internationalOrder.id,
            shippingProviderId: mockShippingProviderUser.id,
            bidAmount: parseFloat(bidForm.bidAmount),
            estimatedDelivery: bidForm.estimatedDelivery,
            message: `${bidForm.message} ${isInternational ? '(International shipping with customs handling)' : ''}`,
            status: 'pending' as const
          }
          
          await createShippingBid(payload)
        }
        
        return (
          <div>
            <div data-testid="order-type">
              {isInternational ? 'International Order' : 'Domestic Order'}
            </div>
            <input
              data-testid="shipping-amount"
              type="number"
              value={bidForm.bidAmount}
              onChange={(e) => setBidForm(prev => ({ ...prev, bidAmount: e.target.value }))}
              placeholder="Shipping Cost"
            />
            <input
              data-testid="delivery-date"
              type="date"
              value={bidForm.estimatedDelivery}
              onChange={(e) => setBidForm(prev => ({ ...prev, estimatedDelivery: e.target.value }))}
            />
            <textarea
              data-testid="shipping-message"
              value={bidForm.message}
              onChange={(e) => setBidForm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Shipping details"
            />
            <button data-testid="submit-shipping-bid" onClick={handleSubmit}>
              Submit Shipping Bid
            </button>
          </div>
        )
      }
      
      render(<ShippingBidForm />)
      
      expect(screen.getByTestId('order-type')).toHaveTextContent('International Order')
      
      await userEvent.type(screen.getByTestId('shipping-amount'), '85.50')
      await userEvent.type(screen.getByTestId('delivery-date'), '2024-02-20')
      await userEvent.type(screen.getByTestId('shipping-message'), 'Express international shipping')
      
      await userEvent.click(screen.getByTestId('submit-shipping-bid'))
      
      await waitFor(() => {
        expect(createShippingBid).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: internationalOrder.id,
            shippingProviderId: mockShippingProviderUser.id,
            bidAmount: 85.50,
            estimatedDelivery: '2024-02-20',
            message: expect.stringContaining('International shipping with customs handling'),
            status: 'pending'
          })
        )
      })
    })
  })
})

describe('Form Validation and Error Handling', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('Bid Validation', () => {
    it('should validate bid amount is positive', () => {
      const validateBid = (bidAmount: string) => {
        const amount = parseFloat(bidAmount)
        if (isNaN(amount) || amount <= 0) {
          return 'Bid amount must be a positive number'
        }
        return null
      }
      
      expect(validateBid('-10')).toBe('Bid amount must be a positive number')
      expect(validateBid('0')).toBe('Bid amount must be a positive number')
      expect(validateBid('abc')).toBe('Bid amount must be a positive number')
      expect(validateBid('100.50')).toBeNull()
    })

    it('should validate delivery date is in future', () => {
      const validateDeliveryDate = (dateString: string) => {
        const deliveryDate = new Date(dateString)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        if (deliveryDate <= today) {
          return 'Delivery date must be in the future'
        }
        return null
      }
      
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      expect(validateDeliveryDate(yesterday)).toBe('Delivery date must be in the future')
      expect(validateDeliveryDate(tomorrow)).toBeNull()
    })
  })

  describe('International Shipping Validation', () => {
    it('should validate Incoterms for international orders', () => {
      const validateInternationalShipping = (country: string, incoterms: string) => {
        if (country !== 'India' && !incoterms) {
          return 'Incoterms is required for international shipments'
        }
        return null
      }
      
      expect(validateInternationalShipping('Germany', '')).toBe('Incoterms is required for international shipments')
      expect(validateInternationalShipping('Germany', 'FOB')).toBeNull()
      expect(validateInternationalShipping('India', '')).toBeNull()
    })
  })
})