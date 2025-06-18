import { type User, type Session } from '@supabase/supabase-js';
import { getAnonymousSessionId } from './anonymousSession';

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

const createMockProfile = () => ({
  id: MOCK_USER_ID,
  username: 'Anonymous User',
  score: 0,
  viewed_prompts: [],
  age_range: null,
  education_level: null,
  first_language: null,
  literature_interest: null,
  writing_background: null,
  demographics_completed: false,
});

const createMockSession = (): Session => ({
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  user: createMockUser(),
} as Session);

export const getMockAuthData = () => ({
  user: createMockUser(),
  session: createMockSession(),
  profile: createMockProfile(),
});

// Get config from client-side config
import { config } from '@/lib/config-client';

export const shouldBypassAuth = () => {
  return config.disableAuthentication;
};

/**
 * Check if the app is in hybrid authentication mode
 * In hybrid mode, anonymous users can access features but are encouraged to sign up
 */
export const isHybridAuthMode = () => {
  return !config.disableAuthentication;
};

/**
 * Check if user should be encouraged to sign up
 * Returns true for anonymous users in hybrid mode
 */
export const shouldEncourageSignup = (user: User | null) => {
  return isHybridAuthMode() && !user;
};

/**
 * Get features available to authenticated users only
 */
export const getAuthenticatedOnlyFeatures = () => {
  return [
    'personal_statistics',
    'advanced_analytics', 
    'export_data',
    'custom_preferences',
    'progress_tracking',
    'achievement_badges'
  ];
};

/**
 * Check if a feature requires authentication
 */
export const requiresAuthentication = (feature: string) => {
  const authOnlyFeatures = getAuthenticatedOnlyFeatures();
  return authOnlyFeatures.includes(feature);
};

/**
 * Get an effective user ID for server-side API calls
 * Returns anonymous session ID for client-side or generates one for server-side
 */
export const getEffectiveUserIdForServer = (): string => {
  if (shouldBypassAuth()) {
    // Try to get client-side session ID first
    const clientSessionId = getAnonymousSessionId();
    if (clientSessionId) {
      return clientSessionId;
    }
    
    // For server-side calls, generate a temporary session ID
    // This will be replaced by client-side session management in practice
    return `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return MOCK_USER_ID; // Fallback, shouldn't be reached
};

/**
 * Get the effective user ID - either real user ID or anonymous session ID
 */
export const getEffectiveUserId = (): string | null => {
  if (shouldBypassAuth()) {
    return getAnonymousSessionId();
  }
  return null; // Will be handled by normal auth flow
};

/**
 * Clear authentication state and cookies
 */
export const clearAuthState = () => {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    try {
      window.localStorage.removeItem('supabase.auth.token');
      window.localStorage.removeItem('anonymous_session_id');
      window.localStorage.removeItem('anonymousSessionId');
      
      // Clear any other auth-related localStorage items
      Object.keys(window.localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          window.localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
    
    // Clear sessionStorage 
    try {
      window.sessionStorage.removeItem('supabase.auth.token');
      Object.keys(window.sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }
    
    // Clear cookies by setting them to expire
    const cookiesToClear = [
      'supabase-auth-token',
      'supabase.auth.token', 
      'anonymous_session_id',
      'anonymousSessionId'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=${window.location.hostname}`;
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
    });
    
    console.log('Auth state cleared completely');
  }
};

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Get a user-friendly error message from an auth error
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error instanceof Error ? error.message : String(error);
  
  // Map common Supabase auth errors to user-friendly messages
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before signing in.';
  }
  if (message.includes('User not found')) {
    return 'No account found with this email address.';
  }
  if (message.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('Unable to validate email address')) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('Password is too weak')) {
    return 'Please choose a stronger password.';
  }
  if (message.includes('rate_limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  
  return message;
}

/**
 * Get the site URL for redirects
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

/**
 * Log authentication state for debugging
 */
export function logAuthState(context: string, data: unknown) {
  if (isDevelopment()) {
    console.log(`[AUTH DEBUG - ${context}]:`, data);
  }
} 