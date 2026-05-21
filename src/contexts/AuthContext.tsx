// @ts-nocheck

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext<any>({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Guard against SSR
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Email/Password Sign Up
  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4028';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${appUrl}/auth/callback`,
          data: {
            full_name: metadata?.fullName || '',
            role: metadata?.role || 'student',
            avatar_url: metadata?.avatarUrl || ''
          }
        }
      });
      
      if (error) {
        console.error('Supabase signUp error:', error);
        throw error;
      }
      
      return data;
    } catch (error: any) {
      console.error('SignUp error:', error);
      throw error;
    }
  };

  // Send OTP via Resend email service (6-digit code)
  const sendEmailOtp = async (email: string, type: 'signup' | 'password_reset' = 'signup') => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, type }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
  };

  // Verify email OTP token via custom otp_codes table
  const verifyEmailOtp = async (email: string, token: string) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'OTP verification failed');
    return data;
  };

  // Email/Password Sign In
  const signIn = async (identifier: string, password: string, isPhone: boolean = false) => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    if (isPhone) {
      // Phone authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        phone: identifier,
        password
      });
      if (error) throw error;
      return data;
    } else {
      // Email authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password
      });
      if (error) throw error;
      return data;
    }
  };

  // Sign Out
  const signOut = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // Get Current User
  const getCurrentUser = async () => {
    if (!supabase) throw new Error('Supabase client not initialized');
    
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  };

  // Check if Email is Verified
  const isEmailVerified = () => {
    return !!user?.email_confirmed_at;
  };

  // Get User Profile from Database
  const getUserProfile = async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    return data;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    isEmailVerified,
    getUserProfile,
    sendEmailOtp,
    verifyEmailOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
