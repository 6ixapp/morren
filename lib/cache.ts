// Local Storage Cache Utility to reduce Supabase requests

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

const CACHE_PREFIX = 'morren_cache_';

export class LocalCache {
  /**
   * Set data in cache with expiration
   * @param key Cache key
   * @param data Data to cache
   * @param expiresIn Expiration time in milliseconds (default: 5 minutes)
   */
  static set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    if (typeof window === 'undefined') return; // SSR safety
    
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresIn,
      };
      
      localStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  /**
   * Get data from cache if not expired
   * @param key Cache key
   * @returns Cached data or null if expired/not found
   */
  static get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null; // SSR safety
    
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - cacheItem.timestamp > cacheItem.expiresIn) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Remove specific cache item
   * @param key Cache key
   */
  static remove(key: string): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.warn('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache items
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Check if cache exists and is valid
   * @param key Cache key
   * @returns true if cache exists and not expired
   */
  static has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get cache age in milliseconds
   * @param key Cache key
   * @returns Age in milliseconds or null if not found
   */
  static getAge(key: string): number | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem: CacheItem<any> = JSON.parse(cached);
      return Date.now() - cacheItem.timestamp;
    } catch (error) {
      return null;
    }
  }
}

// Cache key generators
export const CacheKeys = {
  orders: (userId: string) => `orders_${userId}`,
  bids: (userId: string) => `bids_${userId}`,
  shippingBids: (userId: string) => `shipping_bids_${userId}`,
  items: () => 'items_active',
  stats: (userId: string) => `stats_${userId}`,
  orderBids: (orderId: string) => `order_bids_${orderId}`,
  shippingOrderBids: (orderId: string) => `shipping_order_bids_${orderId}`,
};

// Cache expiration times (in milliseconds)
export const CacheDuration = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,      // 5 minutes
  LONG: 15 * 60 * 1000,       // 15 minutes
  VERY_LONG: 60 * 60 * 1000,  // 1 hour
};

