import { config } from '@/lib/config-client';
import { User, Session, SupabaseClient } from '@supabase/supabase-js';

// Mock user data for when authentication is disabled
export const MOCK_USER_ID = 'mock-user-id';

export const createMockUser = (): User => ({
  id: MOCK_USER_ID,
  email: 'mock@example.com',
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_anonymous: false,
  app_metadata: {},
  user_metadata: {},
  role: 'authenticated',
  aud: 'authenticated',
  identities: [],
} as User);

export const createMockSession = (): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: createMockUser(),
});

export const createMockProfile = () => ({
  id: MOCK_USER_ID,
  username: 'mock@example.com',
  score: 0,
  viewed_prompts: [],
  age_range: null,
  education_level: null,
  first_language: null,
  literature_interest: null,
  writing_background: null,
  demographics_completed: false,
});

export const shouldBypassAuth = () => {
  return config.disableAuthentication;
};

export const getMockAuthData = () => {
  if (!shouldBypassAuth()) {
    return { user: null, session: null, profile: null };
  }
  
  return {
    user: createMockUser(),
    session: createMockSession(),
    profile: createMockProfile(),
  };
};

// Utility to clear corrupted auth state
export const clearAuthState = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('sb-huavbzsevepndkbgikoi-auth-token');
    
    // Clear sessionStorage
    sessionStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('sb-huavbzsevepndkbgikoi-auth-token');
    
    // Clear any other auth-related items
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('Auth state cleared');
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

// Helper function for API routes to get user ID (real or mock)
export const getUserIdForApi = async (supabase: SupabaseClient): Promise<string | null> => {
  if (shouldBypassAuth()) {
    return MOCK_USER_ID;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  return session?.user?.id || null;
};

// Helper function for API routes to handle authentication
export const handleApiAuth = async (supabase: SupabaseClient): Promise<{ userId: string | null; isAuthenticated: boolean }> => {
  if (shouldBypassAuth()) {
    return { userId: MOCK_USER_ID, isAuthenticated: true };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    userId: session?.user?.id || null,
    isAuthenticated: !!session?.user,
  };
};

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get the current site URL for redirects
 */
export function getSiteUrl(): string {
  // In development, check for server port dynamically
  if (isDevelopment() && typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

/**
 * Debug function to log authentication state
 */
export function logAuthState(context: string, data: unknown) {
  if (isDevelopment()) {
    console.log(`[AUTH DEBUG - ${context}]:`, data);
  }
}

/**
 * Handle authentication errors with user-friendly messages
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return '';
  
  const message = (error as { message?: string }).message || String(error);
  
  // Common error patterns and user-friendly messages
  if (message.includes('Invalid login credentials') || message.includes('Invalid credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  
  if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'An account with this email already exists. Please try signing in instead.';
  }
  
  if (message.includes('rate_limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  
  if (message.includes('weak_password')) {
    return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
  }
  
  if (message.includes('invalid_email')) {
    return 'Please enter a valid email address.';
  }
  
  // Return original message if no pattern matches
  return message;
} 