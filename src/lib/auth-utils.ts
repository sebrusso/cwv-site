import { config } from '@/config';
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