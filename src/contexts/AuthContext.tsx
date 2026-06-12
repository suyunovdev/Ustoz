'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl?: string | null;
  bio?: string | null;
}

interface AuthSession {
  user: AuthUser;
}

interface SignUpResult {
  user: { email: string };
  session: null;
  devOtp?: string;
  emailDelivered?: boolean;
}

interface OtpResult {
  devOtp?: string;
  emailDelivered?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<SignUpResult>;
  signIn: (identifier: string, password: string, isPhone?: boolean) => Promise<{ user: AuthUser }>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  isEmailVerified: () => boolean;
  getUserProfile: () => Promise<AuthUser | null>;
  sendEmailOtp: (email: string, type?: 'signup' | 'password_reset') => Promise<OtpResult>;
  verifyEmailOtp: (email: string, token: string, signupData?: { fullName: string; password: string; role: string }) => Promise<{ user?: AuthUser }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

async function apiPost(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

async function apiGet(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await apiGet('/api/auth/me');
      if (data?.user) {
        setUser(data.user);
        setSession({ user: data.user });
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      console.error('refreshUser error:', err);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Sign Up flow: emailni tekshirib OTP yuboradi. User OTP'ni verify qilganda yaratiladi.
  // Form bu funksiyani chaqiradi, keyin OTP step ochiladi.
  const signUp = async (email: string, _password: string, _metadata?: Record<string, unknown>): Promise<SignUpResult> => {
    const data = await apiPost('/api/auth/send-otp', { email, type: 'signup' });
    // session yo'q — RegistrationForm OTP step'ni ochadi. devOtp dev rejimida qaytadi.
    return { user: { email }, session: null, devOtp: data?.devOtp, emailDelivered: data?.emailDelivered };
  };

  // Send OTP via Resend (server-side route)
  const sendEmailOtp = async (email: string, type: 'signup' | 'password_reset' = 'signup') => {
    const data = await apiPost('/api/auth/send-otp', { email, type });
    return { devOtp: data?.devOtp, emailDelivered: data?.emailDelivered };
  };

  // Verify email OTP. Signup kontekstida signupData ni ham yuboradi → user yaratiladi va session cookie qo'yiladi.
  const verifyEmailOtp = async (
    email: string,
    token: string,
    signupData?: { fullName: string; password: string; role: string }
  ) => {
    const data = await apiPost('/api/auth/verify-otp', {
      email,
      otp: token,
      ...(signupData || {}),
    });
    if (data?.user) {
      setUser(data.user);
      setSession({ user: data.user });
    }
    return data;
  };

  // Email/Password Sign In via JWT API
  const signIn = async (identifier: string, password: string, _isPhone: boolean = false) => {
    const data = await apiPost('/api/auth/login', { email: identifier, password });
    setUser(data.user);
    setSession({ user: data.user });
    return data;
  };

  // Sign Out
  const signOut = async () => {
    await apiPost('/api/auth/logout', {});
    setUser(null);
    setSession(null);
  };

  // Get Current User
  const getCurrentUser = async () => {
    const data = await apiGet('/api/auth/me');
    return data?.user || null;
  };

  // Email verification (handled inside register flow via OTP)
  const isEmailVerified = () => !!user;

  // Get User Profile (already returned from /api/auth/me)
  const getUserProfile = async () => {
    const data = await apiGet('/api/auth/me');
    return data?.user || null;
  };

  const value: AuthContextValue = {
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
