"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable");
}

declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined;
}

export const supabase =
  globalThis.supabaseClient ?? createClient(supabaseUrl, supabaseKey);

if (process.env.NODE_ENV !== "production") {
  globalThis.supabaseClient = supabase;
  console.log("Supabase client initialized with URL:", supabaseUrl);
}

export function useSupabase() {
  return supabase;
}
