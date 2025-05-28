import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedPaths = ['/', '/model-evaluation', '/human-machine', '/dashboard'];
  if (protectedPaths.some((p) => request.nextUrl.pathname === p || request.nextUrl.pathname.startsWith(`${p}/`))) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/model-evaluation/:path*', '/human-machine/:path*', '/dashboard/:path*'],
};
