import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestDataGenerator, mockApiResponses, testUtils } from '../../lib/test/test-helpers'

// Mock the API
jest.mock('@/lib/supabase-api', () => ({
  getItems: jest.fn(),
  createOrder: jest.fn(),
  getBidsByOrder: jest.fn(),
  acceptBid: jest.fn(),
  rejectBid: jest.fn(),
  getDashboardStats: jest.fn(),
}))

// Mock Auth Context
const mockBuyerUser = TestDataGenerator.generateUser('buyer')
const mockAuthContext = {
  user: mockBuyerUser,
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

describe('Buyer Dashboard Features', () => {
  beforeEach(() => {
    testUtils.resetMocks()
  })

  describe('Item Browsing and Selection', () => {
    it('should display available items for purchase', async () => {
      const { getItems } = require('@/lib/supabase-api')
      const items = mockApiResponses.items.slice(0, 10)
      
      getItems.mockResolvedValue(items)
      
      const BrowseItems = () => {
        const [itemsList, setItemsList] = React.useState([])
        
        React.useEffect(() => {
          getItems().then(setItemsList)
        }, [])
        
        const handleAddToList = (item: any) => {
          // Add to order list logic
        }
        
        return (
          <div data-testid="browse-items">
            {itemsList.map((item: any) => (
              <div key={item.id} data-testid="item-card">
                <h3>{item.name}</h3>
                <p>Price: ${item.price}</p>
                <p>Seller: {item.seller?.name || 'Unknown'}</p>
                <span>Available: {item.quantity}</span>
                <button
                  data-testid="add-to-list"
                  onClick={() => handleAddToList(item)}>
                  Add to List
                </button>
              </div>
            ))}
          </div>
        )
      }
      
      render(<BrowseItems />)
      
      await waitFor(() => {
        const itemCards = screen.getAllByTestId('item-card')
        expect(itemCards).toHaveLength(10)
      })
      
      const addToListButtons = screen.getAllByTestId('add-to-list')
      expect(addToListButtons).toHaveLength(10)
    })
  })

  describe('Country Selection and Incoterms', () => {
    it('should show Incoterms dropdown for international destinations', async () => {
      const CountryForm = () => {
        const [form, setForm] = React.useState({
          country: '',
          incoterms: ''
        })
        
        const isInternational = form.country && form.country !== 'India'
        
        return (
          <div>
            <select
              data-testid="country-select"
              value={form.country}
              onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value, incoterms: '' }))}>
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="Germany">Germany</option>
              <option value="Japan">Japan</option>
            </select>
            
            {isInternational && (
              <div data-testid="incoterms-section">
                <select
                  data-testid="incoterms-select"
                  value={form.incoterms}
                  onChange={(e) => setForm(prev => ({ ...prev, incoterms: e.target.value }))}>
                  <option value="">Select Incoterms</option>
                  <option value="FOB">FOB - Free on Board</option>
                  <option value="CIF">CIF - Cost, Insurance and Freight</option>
                  <option value="DDP">DDP - Delivered Duty Paid</option>
                  <option value="EXW">EXW - Ex Works</option>
                </select>
              </div>
            )}
            
            <div data-testid="form-state">
              Country: {form.country}, Incoterms: {form.incoterms}
            </div>
          </div>
        )
      }
      
      render(<CountryForm />)
      
      // Initially, Incoterms should not be visible
      expect(screen.queryByTestId('incoterms-section')).not.toBeInTheDocument()
      
      // Select India - Incoterms should still not be visible
      await userEvent.selectOptions(screen.getByTestId('country-select'), 'India')
      expect(screen.queryByTestId('incoterms-section')).not.toBeInTheDocument()
      
      // Select international country - Incoterms should be visible
      await userEvent.selectOptions(screen.getByTestId('country-select'), 'Germany')
      await waitFor(() => {
        expect(screen.getByTestId('incoterms-section')).toBeInTheDocument()
      })
      
      // Select an Incoterms option
      await userEvent.selectOptions(screen.getByTestId('incoterms-select'), 'CIF')
      expect(screen.getByTestId('form-state')).toHaveTextContent('Country: Germany, Incoterms: CIF')
    })

    it('should validate Incoterms for international orders', () => {
      const validateOrderForm = (country: string, incoterms: string) => {
        const errors: string[] = []
        
        if (country && country !== 'India' && !incoterms) {
          errors.push('Incoterms is required for international shipments')
        }
        
        return errors
      }
      
      // Domestic order - no Incoterms required
      expect(validateOrderForm('India', '')).toEqual([])
      
      // International order without Incoterms - should error
      expect(validateOrderForm('Germany', '')).toContain('Incoterms is required for international shipments')
      
      // International order with Incoterms - should pass
      expect(validateOrderForm('Germany', 'CIF')).toEqual([])
    })
  })

  describe('Order Creation and Management', () => {
    it('should create order with country and Incoterms information', async () => {
      const { createOrder } = require('@/lib/supabase-api')
      const orderData = TestDataGenerator.generateOrder()
      
      createOrder.mockResolvedValue(orderData)
      
      const OrderForm = () => {
        const [orderForm, setOrderForm] = React.useState({
          itemId: '',
          quantity: '',
          message: '',
          country: '',
          incoterms: '',
          shippingAddress: ''
        })
        
        const handleSubmit = async () => {
          const notes = orderForm.country !== 'India' 
            ? `Destination: ${orderForm.country} Incoterms: ${orderForm.incoterms} Additional notes: ${orderForm.message}`
            : `Destination: ${orderForm.country} Additional notes: ${orderForm.message}`
          
          const orderPayload = {
            itemId: orderForm.itemId,
            buyerId: mockBuyerUser.id,
            quantity: parseInt(orderForm.quantity),
            status: 'pending' as const,
            shippingAddress: orderForm.shippingAddress,
            notes
          }
          
          await createOrder(orderPayload)
        }
        
        return (
          <div>
            <input
              data-testid="item-id"
              value={orderForm.itemId}
              onChange={(e) => setOrderForm(prev => ({ ...prev, itemId: e.target.value }))}
            />
            <input
              data-testid="quantity"
              type="number"
              value={orderForm.quantity}
              onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: e.target.value }))}
            />
            <input
              data-testid="shipping-address"
              value={orderForm.shippingAddress}
              onChange={(e) => setOrderForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
            />
            <select
              data-testid="country"
              value={orderForm.country}
              onChange={(e) => setOrderForm(prev => ({ ...prev, country: e.target.value }))}>
              <option value="">Select Country</option>
              <option value="India">India</option>
              <option value="Germany">Germany</option>
            </select>
            
            {orderForm.country !== 'India' && orderForm.country && (
              <select
                data-testid="incoterms"
                value={orderForm.incoterms}
                onChange={(e) => setOrderForm(prev => ({ ...prev, incoterms: e.target.value }))}>
                <option value="">Select Incoterms</option>
                <option value="CIF">CIF - Cost, Insurance and Freight</option>
              </select>
            )}
            
            <button data-testid="create-order" onClick={handleSubmit}>
              Create Order
            </button>
          </div>
        )
      }
      
      render(<OrderForm />)
      
      await userEvent.type(screen.getByTestId('item-id'), 'item-123')
      await userEvent.type(screen.getByTestId('quantity'), '50')
      await userEvent.type(screen.getByTestId('shipping-address'), '123 Test St, Berlin, Germany')
      await userEvent.selectOptions(screen.getByTestId('country'), 'Germany')
      
      // Incoterms should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('incoterms')).toBeInTheDocument()
      })
      
      await userEvent.selectOptions(screen.getByTestId('incoterms'), 'CIF')
      await userEvent.click(screen.getByTestId('create-order'))
      
      await waitFor(() => {
        expect(createOrder).toHaveBeenCalledWith(
          expect.objectContaining({
            itemId: 'item-123',
            buyerId: mockBuyerUser.id,
            quantity: 50,
            status: 'pending',
            shippingAddress: '123 Test St, Berlin, Germany',
            notes: expect.stringContaining('Destination: Germany Incoterms: CIF')
          })
        )
      })
    })

    it('should display orders with shipping information', async () => {
      const ordersWithShipping = [
        {
          ...TestDataGenerator.generateOrder(),
          notes: 'Destination: Germany Incoterms: CIF - Cost, Insurance and Freight Additional notes: Urgent delivery'
        }
      ]
      
      const OrderDisplay = () => {
        const [orders] = React.useState(ordersWithShipping)
        
        const parseOrderNotes = (notes: string) => {
          const destinationMatch = notes.match(/Destination: ([^\\s]+)/)
          const incotermsMatch = notes.match(/Incoterms: ([^\\s]+.*?)(?:Additional|$)/)
          
          return {
            destination: destinationMatch?.[1] || 'Unknown',
            incoterms: incotermsMatch?.[1] || null,
            isInternational: destinationMatch?.[1] && destinationMatch[1] !== 'India'
          }
        }
        
        return (
          <div data-testid="orders-list">
            {orders.map((order: any) => {
              const shippingInfo = parseOrderNotes(order.notes)
              
              return (
                <div key={order.id} data-testid="order-card">
                  <h4>Order #{order.id.slice(0, 8)}</h4>
                  <p>Quantity: {order.quantity}</p>
                  <p>Destination: {shippingInfo.destination}</p>
                  {shippingInfo.isInternational && (
                    <div data-testid="international-info">
                      <span>International Order</span>
                      {shippingInfo.incoterms && (
                        <p data-testid="incoterms-display">
                          Incoterms: {shippingInfo.incoterms}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
      
      render(<OrderDisplay />)
      
      const orderCards = screen.getAllByTestId('order-card')
      expect(orderCards).toHaveLength(1)
      
      // Check international order displays
      const internationalInfo = screen.getAllByTestId('international-info')
      expect(internationalInfo).toHaveLength(1)
      
      const incotermsDisplay = screen.getByTestId('incoterms-display')
      expect(incotermsDisplay).toHaveTextContent('CIF - Cost, Insurance and Freight')
    })
  })

  describe('Bid Management', () => {
    it('should display received bids for orders', async () => {
      const { getBidsByOrder } = require('@/lib/supabase-api')
      const order = TestDataGenerator.generateOrder()
      const bids = [
        TestDataGenerator.generateBid(order.id, 'seller-1'),
        TestDataGenerator.generateBid(order.id, 'seller-2'),
        TestDataGenerator.generateBid(order.id, 'seller-3')
      ]
      
      getBidsByOrder.mockResolvedValue(bids)
      
      const BidsList = () => {
        const [bidsList, setBidsList] = React.useState([])
        
        React.useEffect(() => {
          getBidsByOrder(order.id).then(setBidsList)
        }, [])
        
        return (
          <div data-testid="bids-list">
            {bidsList.map((bid: any) => (
              <div key={bid.id} data-testid="bid-card">
                <p>Amount: ${bid.bidAmount}</p>
                <p>Delivery: {bid.estimatedDelivery}</p>
                <p>Status: {bid.status}</p>
                <span>Seller: {bid.seller?.name || 'Unknown'}</span>
              </div>
            ))}
          </div>
        )
      }
      
      render(<BidsList />)
      
      await waitFor(() => {
        const bidCards = screen.getAllByTestId('bid-card')
        expect(bidCards).toHaveLength(3)
      })
    })

    it('should accept a bid', async () => {
      const { acceptBid } = require('@/lib/supabase-api')
      const bid = TestDataGenerator.generateBid('order-123', 'seller-456')
      
      acceptBid.mockResolvedValue({ ...bid, status: 'accepted' })
      
      const AcceptBidButton = () => {
        const handleAcceptBid = async () => {
          await acceptBid(bid.id)
        }
        
        return (
          <button data-testid="accept-bid" onClick={handleAcceptBid}>
            Accept Bid
          </button>
        )
      }
      
      render(<AcceptBidButton />)
      
      await userEvent.click(screen.getByTestId('accept-bid'))
      
      await waitFor(() => {
        expect(acceptBid).toHaveBeenCalledWith(bid.id)
      })
    })
  })

  describe('Dashboard Statistics', () => {
    it('should display buyer dashboard stats', async () => {
      const { getDashboardStats } = require('@/lib/supabase-api')
      const stats = {
        totalOrders: 25,
        pendingOrders: 8,
        completedOrders: 15,
        totalSpent: 12500,
        activeBids: 12
      }
      
      getDashboardStats.mockResolvedValue(stats)
      
      const DashboardStats = () => {
        const [statsData, setStatsData] = React.useState(null)
        
        React.useEffect(() => {
          getDashboardStats(mockBuyerUser.id).then(setStatsData)
        }, [])
        
        if (!statsData) return <div>Loading...</div>
        
        return (
          <div data-testid="dashboard-stats">
            <div data-testid="total-orders">Orders: {statsData.totalOrders}</div>
            <div data-testid="pending-orders">Pending: {statsData.pendingOrders}</div>
            <div data-testid="completed-orders">Completed: {statsData.completedOrders}</div>
            <div data-testid="total-spent">Spent: ${statsData.totalSpent}</div>
            <div data-testid="active-bids">Active Bids: {statsData.activeBids}</div>
          </div>
        )
      }
      
      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByTestId('total-orders')).toHaveTextContent('Orders: 25')
        expect(screen.getByTestId('pending-orders')).toHaveTextContent('Pending: 8')
        expect(screen.getByTestId('completed-orders')).toHaveTextContent('Completed: 15')
        expect(screen.getByTestId('total-spent')).toHaveTextContent('Spent: $12500')
        expect(screen.getByTestId('active-bids')).toHaveTextContent('Active Bids: 12')
      })
    })
  })
})