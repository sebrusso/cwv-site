"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { shouldBypassAuth } from '@/lib/auth-utils'

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined;
}

// Configure auth options based on bypass setting
const authOptions = shouldBypassAuth() ? {
  // Disable authentication entirely when auth is bypassed
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    flowType: 'implicit' as const,
  }
} : {
  // Standard auth configuration with proper PKCE flow
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  }
}

export const supabase =
  globalThis.supabaseClient ?? createClient(supabaseUrl, supabaseAnonKey, authOptions);

if (process.env.NODE_ENV !== "production") {
  globalThis.supabaseClient = supabase;
  console.log("Supabase client initialized with URL:", supabaseUrl);
  console.log("Auth bypass enabled:", shouldBypassAuth());
}

export function useSupabase() {
  return supabase;
}
