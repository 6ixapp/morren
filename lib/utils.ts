import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get a user-facing message from any thrown value.
 * Handles Error, Supabase/PostgREST errors (message, details, hint), and unknown.
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  if (error && typeof error === 'object') {
    const e = error as { details?: string; hint?: string; message?: string };
    if (e.details) return e.details;
    if (e.hint) return e.hint;
    if (e.message) return e.message;
  }
  return typeof error === 'string' ? error : fallback;
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
