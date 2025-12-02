'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { getUserById } from '@/lib/supabase-api';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('Auth session:', currentSession ? 'exists' : 'null');
      setSession(currentSession);
      setSupabaseUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        console.log('User ID:', currentSession.user.id);
        
        // Fetch user profile from users table
        let profile = await getUserById(currentSession.user.id);
        console.log('User profile:', profile);
        
        if (profile) {
          setUser(profile);
        } else {
          // If profile doesn't exist, create it from auth metadata
          console.log('Creating user profile with metadata:', currentSession.user.user_metadata);
          
          // Use upsert to handle race conditions
          const { data: profileData, error } = await supabase
            .from('users')
            .upsert({
              id: currentSession.user.id,
              email: currentSession.user.email!,
              name: currentSession.user.user_metadata?.name || currentSession.user.email?.split('@')[0] || 'User',
              role: currentSession.user.user_metadata?.role || 'buyer',
            }, { onConflict: 'id' })
            .select()
            .single();

          if (error) {
            console.error('Error creating/updating user profile:', error);
          } else if (profileData) {
            console.log('Created/updated user profile:', profileData);
            setUser(profileData);
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    refreshUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        await refreshUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'buyer' | 'seller' | 'admin') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });

      if (error) {
        return { error };
      }

      // User profile is automatically created by database trigger
      // Just wait a moment for the trigger to complete, then refresh
      if (data.user) {
        // Wait for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        await refreshUser();
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    await refreshUser();
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
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

