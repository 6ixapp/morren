'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import * as api from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin' | 'shipping_provider') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = api.getAccessToken();

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Fetching current user...');
      const currentUser = await api.getCurrentUser();
      console.log('Current user:', currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      api.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safety timeout - if auth check takes more than 10 seconds, stop loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing loading to stop');
        setLoading(false);
        setUser(null);
      }
    }, 10000); // 10 second timeout

    // Get initial user
    refreshUser().finally(() => {
      clearTimeout(timeoutId);
    });

    // Set up automatic token refresh every 50 minutes (tokens expire in 1 hour)
    const refreshInterval = setInterval(async () => {
      const token = api.getAccessToken();
      if (token) {
        console.log('Refreshing access token...');
        const refreshed = await api.refreshAccessToken();
        if (!refreshed) {
          console.error('Token refresh failed - logging out');
          await signOut();
        } else {
          console.log('Token refreshed successfully');
        }
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => {
      clearTimeout(timeoutId);
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: 'buyer' | 'seller' | 'admin' | 'shipping_provider'
  ) => {
    try {
      console.log('Starting signup with:', { email, name, role });

      const response = await api.signUp(email, password, name, role);
      console.log('Signup response:', response);

      if (response.user) {
        setUser(response.user);
        await refreshUser();
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup exception:', error);
      return { error: { message: error.message || 'Signup failed' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in...');
      const response = await api.signIn(email, password);
      console.log('Sign in successful');

      if (response.user) {
        setUser(response.user);
      }

      return { error: null };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { error: { message: error.message || 'Sign in failed' } };
    }
  };

  const signOut = async () => {
    try {
      await api.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      api.clearTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
