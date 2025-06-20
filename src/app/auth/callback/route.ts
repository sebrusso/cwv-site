import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function handleAuthCallback(
  supabase: SupabaseClient,
  code: string | null,
  redirect: string | null,
  origin: string
) {
  const { data: { session } } = await supabase.auth.getSession();

  // If the user is in a password recovery flow, redirect them to the update password page.
  if (session?.user?.aud === 'authenticated' && code) {
    // This indicates a password recovery session.
    const redirectUrl = new URL('/auth/update-password', origin);
    redirectUrl.searchParams.set('token', code); // Forward the token
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
  return NextResponse.redirect(redirect || siteUrl);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  return handleAuthCallback(supabase, code, redirect, requestUrl.origin);
}
