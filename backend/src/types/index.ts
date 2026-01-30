// User types
export type UserRole = 'buyer' | 'seller' | 'admin' | 'shipping_provider';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
  refreshToken?: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Item types
export interface Item {
  id: string;
  name: string;
  description?: string;
  image?: string;
  price?: number;
  size?: string;
  category?: string;
  condition?: string;
  quantity: number;
  specifications?: Record<string, any>;
  sellerId?: string;
  status: string;
  seller?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface Order {
  id: string;
  itemId: string;
  buyerId: string;
  quantity: number;
  totalPrice: number;
  status: string;
  shippingAddress?: string;
  notes?: string;
  item?: Item;
  buyer?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Bid types
export interface Bid {
  id: string;
  orderId: string;
  sellerId: string;
  bidAmount: number;
  estimatedDelivery?: string;
  message?: string;
  pickupAddress?: string;
  status: string;
  order?: Order;
  seller?: User;
  createdAt: Date;
  updatedAt: Date;
}

// Shipping bid types
export interface ShippingBid {
  id: string;
  orderId: string;
  shippingProviderId: string;
  bidAmount: number;
  estimatedDelivery?: string;
  message?: string;
  quantityKgs?: number;
  portOfLoading?: string;
  destinationAddress?: string;
  incoterms?: string;
  mode?: string;
  status: string;
  order?: Order;
  shippingProvider?: User;
  createdAt: Date;
  updatedAt: Date;
}

// RFQ types
export interface RFQ {
  id: string;
  buyerId: string;
  productName: string;
  specs?: string;
  quantity: number;
  unit?: string;
  requiredByDate?: Date;
  status: string;
  awardedTo?: {
    supplierId: string;
    supplierName: string;
    price: number;
  };
  invites?: SupplierInvite[];
  quotes?: Quote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  createdAt: Date;
}

export interface SupplierInvite {
  id: string;
  rfqId: string;
  supplierId: string;
  status: string;
  inviteToken: string;
  sentAt: Date;
  viewedAt?: Date;
  quotedAt?: Date;
}

export interface Quote {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryDays?: number;
  validityDays?: number;
  notes?: string;
  submittedAt: Date;
  updatedAt: Date;
}

// Market price types
export interface MarketPrice {
  id: string;
  productName: string;
  price: number;
  date: Date;
  createdAt: Date;
}

// Buyer profile types
export interface BuyerProfile {
  buyerId: string;
  companyName?: string;
  buyerName?: string;
  email?: string;
  updatedAt: Date;
}

// Stats types
export interface DashboardStats {
  totalItems?: number;
  activeItems?: number;
  totalOrders?: number;
  pendingOrders?: number;
  totalRevenue?: number;
  totalUsers?: number;
  totalBids?: number;
  activeBids?: number;
}

// Request types
export interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  image?: string;
  price?: number;
  size?: string;
  category?: string;
  condition?: string;
  quantity: number;
  specifications?: Record<string, any>;
  sellerId?: string;
  status?: string;
}

export interface CreateOrderRequest {
  itemId: string;
  buyerId: string;
  quantity: number;
  totalPrice: number;
  status?: string;
  shippingAddress?: string;
  notes?: string;
}

export interface CreateBidRequest {
  orderId: string;
  sellerId: string;
  bidAmount: number;
  estimatedDelivery?: string;
  message?: string;
  pickupAddress?: string;
  status?: string;
}

export interface CreateShippingBidRequest {
  orderId: string;
  shippingProviderId: string;
  bidAmount: number;
  estimatedDelivery?: string;
  message?: string;
  quantityKgs?: number;
  portOfLoading?: string;
  destinationAddress?: string;
  incoterms?: string;
  mode?: string;
  status?: string;
}

export interface CreateRFQRequest {
  buyerId: string;
  productName: string;
  specs?: string;
  quantity: number;
  unit?: string;
  requiredByDate?: Date;
}

export interface CreateSupplierRequest {
  name: string;
  email: string;
  phone?: string;
  contactPerson?: string;
}

export interface CreateQuoteRequest {
  rfqId: string;
  supplierId: string;
  supplierName: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryDays?: number;
  validityDays?: number;
  notes?: string;
}
