import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Maps user role to dashboard route path
 * Handles special cases like shipping_provider -> shipping-provider
 */
export function getDashboardRoute(role: string): string {
  const roleRouteMap: Record<string, string> = {
    'buyer': 'buyer',
    'seller': 'seller',
    'admin': 'admin',
    'shipping_provider': 'shipping-provider',
  };
  return `/dashboard/${roleRouteMap[role] || role}`;
}
