import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { serverConfig as appConfig } from '@/lib/server-config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If authentication is completely disabled, skip all auth checks
  if (appConfig.disableAuthentication) {
    return response;
  }

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

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    // If there's an auth error, clear cookies and allow access in hybrid mode
    if (sessionError) {
      console.warn('Session error in middleware:', sessionError.message);
      
      // Clear auth cookies
      response.cookies.delete('supabase-auth-token');
      response.cookies.delete('supabase.auth.token');
      
      // In hybrid mode, continue to app instead of redirecting to login
      // Anonymous users can still access all features
      return response;
    }

    // Check if this is an authentication-required path (admin/restricted pages only)
    const authRequiredPaths = ['/admin', '/dashboard/admin'];
    const isAuthRequiredPath = authRequiredPaths.some((p) => 
      request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`)
    );

    // Only redirect to login for strictly authentication-required paths
    if (isAuthRequiredPath && !session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      loginUrl.searchParams.set('required', 'true'); // Indicate this is a required auth
      return NextResponse.redirect(loginUrl);
    }

    // Add headers to indicate authentication status for client-side
    if (session) {
      response.headers.set('x-user-authenticated', 'true');
      response.headers.set('x-user-id', session.user.id);
    } else {
      response.headers.set('x-user-authenticated', 'false');
      response.headers.set('x-user-anonymous', 'true');
    }

    return response;
  } catch (error) {
    console.error('Middleware auth error:', error);
    
    // In hybrid mode, don't redirect on errors - let anonymous users continue
    // Clear any problematic auth cookies but allow access
    response.cookies.delete('supabase-auth-token');
    response.cookies.delete('supabase.auth.token');
    
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
