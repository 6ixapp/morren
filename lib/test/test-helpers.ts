import { User, Item, Order, Bid, ShippingBid, UserRole } from '@/lib/types'

// Test data generators using a simple random generator
class TestDataGenerator {
  private static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[TestDataGenerator.getRandomInt(0, array.length - 1)]
  }

  private static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  static generateEmail(): string {
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.org']
    const username = this.generateRandomString(8)
    const domain = this.getRandomElement(domains)
    return `${username}@${domain}`
  }

  static generateUser(role?: UserRole): User {
    const roles: UserRole[] = ['buyer', 'seller', 'admin', 'shipping_provider']
    const names = [
      'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Wilson', 'David Brown',
      'Emily Davis', 'Robert Miller', 'Lisa Anderson', 'James Taylor', 'Maria Garcia'
    ]
    
    return {
      id: this.generateRandomString(24),
      name: this.getRandomElement(names),
      email: this.generateEmail(),
      role: role || this.getRandomElement(roles),
      avatar: `https://avatar.vercel.sh/${this.generateRandomString(8)}`,
      phone: `+1${this.getRandomInt(1000000000, 9999999999)}`,
      address: `${this.getRandomInt(100, 9999)} ${this.getRandomElement(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr'])}`,
      createdAt: new Date(Date.now() - this.getRandomInt(0, 365 * 24 * 60 * 60 * 1000))
    }
  }

  static generateItem(sellerId?: string): Item {
    const spices = [
      'Premium Black Pepper', 'Organic Turmeric Powder', 'Ceylon Cinnamon Sticks',
      'Cardamom Green Bold', 'Cumin Seeds Premium', 'Coriander Seeds', 'Red Chilli Powder',
      'Garam Masala Blend', 'Fennel Seeds', 'Mustard Seeds Yellow', 'Cloves Hand Picked',
      'Nutmeg Whole', 'Star Anise', 'Bay Leaves Dried', 'Fenugreek Seeds'
    ]
    
    const categories = ['Spices', 'Herbs', 'Seasonings', 'Blends', 'Whole Spices']
    const conditions = ['new', 'used', 'refurbished'] as const
    const sizes = ['1kg', '5kg', '10kg', '25kg', '50kg', '100kg']
    const statuses = ['active', 'sold', 'inactive'] as const

    return {
      id: this.generateRandomString(24),
      name: this.getRandomElement(spices),
      description: `High quality ${this.getRandomElement(spices).toLowerCase()} sourced from premium suppliers`,
      image: '/api/placeholder/400/300',
      price: this.getRandomInt(10, 500),
      size: this.getRandomElement(sizes),
      category: this.getRandomElement(categories),
      condition: this.getRandomElement(conditions),
      quantity: this.getRandomInt(1, 1000),
      specifications: {
        'HSN Code': `${this.getRandomInt(1000, 9999)}`,
        'Quality Grade': this.getRandomElement(['Premium', 'Standard', 'Economy']),
        'Origin': this.getRandomElement(['India', 'Sri Lanka', 'Indonesia', 'Vietnam']),
        'Packaging': this.getRandomElement(['Jute Bags', 'PP Bags', 'Cardboard Boxes'])
      },
      sellerId: sellerId || this.generateRandomString(24),
      status: this.getRandomElement(statuses),
      createdAt: new Date(Date.now() - this.getRandomInt(0, 90 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    }
  }

  static generateOrder(itemId?: string, buyerId?: string): Order {
    const statuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'] as const
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad']
    const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat']
    
    return {
      id: this.generateRandomString(24),
      itemId: itemId || this.generateRandomString(24),
      buyerId: buyerId || this.generateRandomString(24),
      quantity: this.getRandomInt(1, 100),
      totalPrice: this.getRandomInt(100, 10000),
      status: this.getRandomElement(statuses),
      shippingAddress: `${this.getRandomInt(1, 999)} ${this.getRandomElement(['Business Park', 'Industrial Area', 'Commercial Complex'])}, ${this.getRandomElement(cities)}, ${this.getRandomElement(states)} - ${this.getRandomInt(100000, 999999)}`,
      notes: this.getRandomInt(0, 3) > 0 ? `Special requirements: ${this.getRandomElement(['Express delivery', 'Quality inspection', 'Custom packaging', 'Weekend delivery'])}` : undefined,
      createdAt: new Date(Date.now() - this.getRandomInt(0, 30 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    }
  }

  static generateBid(orderId?: string, sellerId?: string): Bid {
    const statuses = ['pending', 'accepted', 'rejected'] as const
    const messages = [
      'We can offer the best quality at competitive prices',
      'Express delivery available',
      'Bulk discount applicable',
      'Premium quality guaranteed',
      'Direct from manufacturer'
    ]

    return {
      id: this.generateRandomString(24),
      orderId: orderId || this.generateRandomString(24),
      sellerId: sellerId || this.generateRandomString(24),
      bidAmount: this.getRandomInt(50, 5000),
      estimatedDelivery: new Date(Date.now() + this.getRandomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
      message: this.getRandomInt(0, 2) > 0 ? this.getRandomElement(messages) : undefined,
      status: this.getRandomElement(statuses),
      createdAt: new Date(Date.now() - this.getRandomInt(0, 7 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    }
  }

  static generateShippingBid(orderId?: string, shippingProviderId?: string): ShippingBid {
    const statuses = ['pending', 'accepted', 'rejected'] as const
    const companies = ['FedEx Express', 'DHL International', 'Blue Dart', 'DTDC Courier', 'Aramex']
    
    return {
      id: this.generateRandomString(24),
      orderId: orderId || this.generateRandomString(24),
      shippingProviderId: shippingProviderId || this.generateRandomString(24),
      bidAmount: this.getRandomInt(20, 500),
      estimatedDelivery: new Date(Date.now() + this.getRandomInt(2, 15) * 24 * 60 * 60 * 1000).toISOString(),
      message: `Fast and reliable delivery by ${this.getRandomElement(companies)}`,
      status: this.getRandomElement(statuses),
      createdAt: new Date(Date.now() - this.getRandomInt(0, 5 * 24 * 60 * 60 * 1000)),
      updatedAt: new Date()
    }
  }

  static generateCountries(): string[] {
    return [
      'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Canada',
      'Australia', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam',
      'Indonesia', 'Philippines', 'Brazil', 'Mexico', 'Argentina', 'Chile', 'South Africa',
      'Egypt', 'Nigeria', 'Kenya', 'UAE', 'Saudi Arabia', 'Turkey', 'Russia', 'China'
    ]
  }

  static generateIncoterms(): Array<{code: string, name: string}> {
    return [
      { code: 'EXW', name: 'Ex Works' },
      { code: 'FCA', name: 'Free Carrier' },
      { code: 'CPT', name: 'Carriage Paid To' },
      { code: 'CIP', name: 'Carriage and Insurance Paid To' },
      { code: 'DAP', name: 'Delivered At Place' },
      { code: 'DPU', name: 'Delivered at Place Unloaded' },
      { code: 'DDP', name: 'Delivered Duty Paid' },
      { code: 'FAS', name: 'Free Alongside Ship' },
      { code: 'FOB', name: 'Free On Board' },
      { code: 'CFR', name: 'Cost and Freight' },
      { code: 'CIF', name: 'Cost, Insurance and Freight' }
    ]
  }
}

// Mock API responses
export const mockApiResponses = {
  users: Array.from({ length: 50 }, () => TestDataGenerator.generateUser()),
  items: Array.from({ length: 100 }, () => TestDataGenerator.generateItem()),
  orders: Array.from({ length: 100 }, () => TestDataGenerator.generateOrder()),
  bids: Array.from({ length: 250 }, () => TestDataGenerator.generateBid()),
  shippingBids: Array.from({ length: 150 }, () => TestDataGenerator.generateShippingBid()),
}

// Test utilities
export const testUtils = {
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock localStorage
  mockLocalStorage: () => {
    const store: { [key: string]: string } = {}
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value },
      removeItem: (key: string) => { delete store[key] },
      clear: () => { Object.keys(store).forEach(key => delete store[key]) }
    }
  },

  // Mock fetch responses
  mockFetch: (data: any, status = 200) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
      })
    ) as jest.Mock
  },

  // Reset all mocks
  resetMocks: () => {
    jest.clearAllMocks()
    if (global.fetch) {
      (global.fetch as jest.Mock).mockClear()
    }
  }
}

export { TestDataGenerator }
export default TestDataGenerator