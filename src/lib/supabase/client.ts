"use client";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Create a single supabase client for the entire app with basic pooling.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined;
}

export const supabase =
  globalThis.supabaseClient ?? createClient(supabaseUrl, supabaseKey);

if (process.env.NODE_ENV !== "production") {
  globalThis.supabaseClient = supabase;
}

export function useSupabase() {
  return supabase;
}
