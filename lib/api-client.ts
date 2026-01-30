// API Client for Morren Backend
// Connects to REST API at http://localhost:5000

import {
  User,
  UserRole,
  Item,
  Order,
  Bid,
  ShippingBid,
  DashboardStats,
  RFQ,
  Supplier,
  Quote,
  MarketPrice,
  BuyerProfile,
  AuthResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

if (typeof window !== 'undefined') {
  accessToken = localStorage.getItem('accessToken');
  refreshToken = localStorage.getItem('refreshToken');
}

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

export const getAccessToken = () => accessToken;

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && refreshToken) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Retry request with new token
        headers['Authorization'] = `Bearer ${accessToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        if (!retryResponse.ok) {
          throw new Error(`API Error: ${retryResponse.statusText}`);
        }

        return await retryResponse.json();
      } else {
        clearTokens();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Auth functions
export async function signUp(
  email: string,
  password: string,
  name: string,
  role: UserRole
): Promise<AuthResponse> {
  const response = await apiCall<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role }),
  });
  setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const response = await apiCall<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setTokens(response.accessToken, response.refreshToken);
  return response;
}

export async function signOut(): Promise<void> {
  try {
    await apiCall('/auth/logout', { method: 'POST' });
  } finally {
    clearTokens();
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiCall<{ user: User }>('/auth/me');
  return response.user;
}

// User functions
export async function getUsers(): Promise<User[]> {
  return await apiCall<User[]>('/api/users');
}

export async function getUserById(id: string): Promise<User> {
  return await apiCall<User>(`/api/users/${id}`);
}

export async function createUser(user: Partial<User> & { password?: string }): Promise<User> {
  return await apiCall<User>('/api/users', {
    method: 'POST',
    body: JSON.stringify(user),
  });
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  return await apiCall<User>(`/api/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function createSellerAccount(email: string, password: string, name: string): Promise<User> {
  return await apiCall<User>('/api/users/seller', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

// Item functions
export async function getItems(): Promise<Item[]> {
  return await apiCall<Item[]>('/api/items');
}

export async function getActiveItems(): Promise<Item[]> {
  return await apiCall<Item[]>('/api/items/active');
}

export async function getItemById(id: string): Promise<Item> {
  return await apiCall<Item>(`/api/items/${id}`);
}

export async function createItem(item: Partial<Item>): Promise<Item> {
  return await apiCall<Item>('/api/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateItem(id: string, updates: Partial<Item>): Promise<Item> {
  return await apiCall<Item>(`/api/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteItem(id: string): Promise<void> {
  await apiCall(`/api/items/${id}`, { method: 'DELETE' });
}

// Order functions
export async function getOrders(): Promise<Order[]> {
  return await apiCall<Order[]>('/api/orders');
}

export async function getOrderById(id: string): Promise<Order> {
  return await apiCall<Order>(`/api/orders/${id}`);
}

export async function getOrdersByBuyer(buyerId: string): Promise<Order[]> {
  return await apiCall<Order[]>(`/api/orders/buyer/${buyerId}`);
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  return await apiCall<Order[]>(`/api/orders/seller/${sellerId}`);
}

export async function getSellerItemOrders(sellerId: string): Promise<Order[]> {
  return await apiCall<Order[]>(`/api/orders/seller/${sellerId}/items`);
}

export async function getOrdersForShipping(): Promise<Order[]> {
  return await apiCall<Order[]>('/api/orders/shipping');
}

export async function createOrder(order: Partial<Order>): Promise<Order> {
  return await apiCall<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order> {
  return await apiCall<Order>(`/api/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  await apiCall(`/api/orders/${id}`, { method: 'DELETE' });
}

// Bid functions
export async function getBids(): Promise<Bid[]> {
  return await apiCall<Bid[]>('/api/bids');
}

export async function getBidById(id: string): Promise<Bid> {
  return await apiCall<Bid>(`/api/bids/${id}`);
}

export async function getBidsByOrder(orderId: string, maskSellerInfo?: boolean): Promise<Bid[]> {
  const mask = maskSellerInfo ? '?maskSellerInfo=true' : '';
  return await apiCall<Bid[]>(`/api/bids/order/${orderId}${mask}`);
}

export async function getBidsBySeller(sellerId: string): Promise<Bid[]> {
  return await apiCall<Bid[]>(`/api/bids/seller/${sellerId}`);
}

export async function createBid(bid: Partial<Bid>): Promise<Bid> {
  return await apiCall<Bid>('/api/bids', {
    method: 'POST',
    body: JSON.stringify(bid),
  });
}

export async function updateBid(id: string, updates: Partial<Bid>): Promise<Bid> {
  return await apiCall<Bid>(`/api/bids/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteBid(id: string): Promise<void> {
  await apiCall(`/api/bids/${id}`, { method: 'DELETE' });
}

// Shipping Bid functions
export async function getShippingBids(): Promise<ShippingBid[]> {
  return await apiCall<ShippingBid[]>('/api/shipping-bids');
}

export async function getShippingBidById(id: string): Promise<ShippingBid> {
  return await apiCall<ShippingBid>(`/api/shipping-bids/${id}`);
}

export async function getShippingBidsByOrder(orderId: string, maskProviderInfo?: boolean): Promise<ShippingBid[]> {
  const mask = maskProviderInfo ? '?maskProviderInfo=true' : '';
  return await apiCall<ShippingBid[]>(`/api/shipping-bids/order/${orderId}${mask}`);
}

export async function getShippingBidsByProvider(providerId: string): Promise<ShippingBid[]> {
  return await apiCall<ShippingBid[]>(`/api/shipping-bids/provider/${providerId}`);
}

export async function createShippingBid(bid: Partial<ShippingBid>): Promise<ShippingBid> {
  return await apiCall<ShippingBid>('/api/shipping-bids', {
    method: 'POST',
    body: JSON.stringify(bid),
  });
}

export async function updateShippingBid(id: string, updates: Partial<ShippingBid>): Promise<ShippingBid> {
  return await apiCall<ShippingBid>(`/api/shipping-bids/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteShippingBid(id: string): Promise<void> {
  await apiCall(`/api/shipping-bids/${id}`, { method: 'DELETE' });
}

// Stats functions
export async function getBuyerStats(buyerId: string): Promise<DashboardStats> {
  return await apiCall<DashboardStats>(`/api/stats/buyer/${buyerId}`);
}

export async function getSellerStats(sellerId: string): Promise<DashboardStats> {
  return await apiCall<DashboardStats>(`/api/stats/seller/${sellerId}`);
}

export async function getAdminStats(): Promise<DashboardStats> {
  return await apiCall<DashboardStats>('/api/stats/admin');
}

// RFQ functions
export async function getRFQs(buyerId?: string): Promise<RFQ[]> {
  const query = buyerId ? `?buyerId=${buyerId}` : '';
  return await apiCall<RFQ[]>(`/api/rfqs${query}`);
}

export async function getRFQById(id: string): Promise<RFQ> {
  return await apiCall<RFQ>(`/api/rfqs/${id}`);
}

export async function getRFQByInviteToken(token: string): Promise<{ rfq: RFQ; invite: any; supplier: Supplier }> {
  return await apiCall<{ rfq: RFQ; invite: any; supplier: Supplier }>(`/api/rfqs/by-invite/${token}`);
}

export async function createRFQ(rfq: Partial<RFQ>): Promise<RFQ> {
  return await apiCall<RFQ>('/api/rfqs', {
    method: 'POST',
    body: JSON.stringify(rfq),
  });
}

export async function updateRFQ(id: string, updates: Partial<RFQ>): Promise<RFQ> {
  return await apiCall<RFQ>(`/api/rfqs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function addInviteToRFQ(rfqId: string, supplierId: string): Promise<any> {
  return await apiCall(`/api/rfqs/${rfqId}/invites`, {
    method: 'POST',
    body: JSON.stringify({ supplierId }),
  });
}

export async function markInviteViewed(token: string): Promise<any> {
  return await apiCall('/api/rfqs/invites/viewed', {
    method: 'PATCH',
    body: JSON.stringify({ token }),
  });
}

export async function submitQuote(
  rfqId: string,
  supplierId: string,
  supplierName: string,
  quoteData: Partial<Quote>
): Promise<Quote> {
  return await apiCall<Quote>(`/api/rfqs/${rfqId}/quote`, {
    method: 'POST',
    body: JSON.stringify({ supplierId, supplierName, ...quoteData }),
  });
}

export async function awardRFQ(rfqId: string, supplierId: string, supplierName: string, price: number): Promise<RFQ> {
  return await apiCall<RFQ>(`/api/rfqs/${rfqId}/award`, {
    method: 'POST',
    body: JSON.stringify({ supplierId, supplierName, price }),
  });
}

// Supplier functions
export async function getSuppliers(): Promise<Supplier[]> {
  return await apiCall<Supplier[]>('/api/suppliers');
}

export async function getSupplierById(id: string): Promise<Supplier> {
  return await apiCall<Supplier>(`/api/suppliers/${id}`);
}

export async function createSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  return await apiCall<Supplier>('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  });
}

// Market Price functions
export async function getMarketPrices(productName?: string): Promise<MarketPrice[]> {
  const query = productName ? `?productName=${productName}` : '';
  return await apiCall<MarketPrice[]>(`/api/market-prices${query}`);
}

export async function addMarketPrice(price: Partial<MarketPrice>): Promise<MarketPrice> {
  return await apiCall<MarketPrice>('/api/market-prices', {
    method: 'POST',
    body: JSON.stringify(price),
  });
}

export async function getLowestQuote(rfqId: string): Promise<Quote | null> {
  try {
    return await apiCall<Quote>(`/api/rfqs/${rfqId}/lowest-quote`);
  } catch {
    return null;
  }
}

// Buyer Profile functions
export async function getBuyerProfile(buyerId: string): Promise<BuyerProfile | null> {
  try {
    return await apiCall<BuyerProfile>(`/api/buyer-profiles/${buyerId}`);
  } catch {
    return null;
  }
}

export async function updateBuyerProfile(buyerId: string, profile: Partial<BuyerProfile>): Promise<BuyerProfile> {
  return await apiCall<BuyerProfile>(`/api/buyer-profiles/${buyerId}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}
