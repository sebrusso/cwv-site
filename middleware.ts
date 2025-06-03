import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { config as appConfig } from '@/config';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // If authentication is disabled globally, skip all auth checks
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

    // If there's an auth error, clear cookies and redirect to login
    if (sessionError) {
      console.warn('Session error in middleware:', sessionError.message);
      
      // Clear auth cookies
      response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('supabase-auth-token');
      response.cookies.delete('supabase.auth.token');
      
      return response;
    }

    const protectedPaths = ['/', '/model-evaluation', '/human-machine', '/dashboard'];
    const isProtectedPath = protectedPaths.some((p) => 
      request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`)
    );

    if (isProtectedPath && !session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (error) {
    console.error('Middleware auth error:', error);
    
    // On any auth error, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    const redirectResponse = NextResponse.redirect(loginUrl);
    
    // Clear any problematic auth cookies
    redirectResponse.cookies.delete('supabase-auth-token');
    redirectResponse.cookies.delete('supabase.auth.token');
    
    return redirectResponse;
  }
}

export const config = {
  matcher: ['/', '/model-evaluation/:path*', '/human-machine/:path*', '/dashboard/:path*'],
};
