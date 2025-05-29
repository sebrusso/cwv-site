import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { shouldBypassAuth } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  // If authentication is disabled, redirect immediately
  if (shouldBypassAuth()) {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    return NextResponse.redirect(redirect || siteUrl);
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect");

  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Handle the auth code exchange
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to login with error
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'auth_error');
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('Exception during code exchange:', error);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'auth_error');
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect to the specified redirect URL or home
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;
  const redirectUrl = new URL(redirect || '/', siteUrl);
  response = NextResponse.redirect(redirectUrl);
  
  return response;
}
