import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin/auth');

  console.log('Middleware:', {
    path: request.nextUrl.pathname,
    hasToken: !!token,
    tokenRole: token?.role,
    isAdminRoute,
    isAuthRoute,
  });

  // Allow access to auth routes
  if (isAuthRoute) {
    if (token?.role === 'admin') {
      console.log('Redirecting to admin dashboard from auth route');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!token) {
      console.log('No token, redirecting to login');
      return NextResponse.redirect(new URL('/admin/auth/login', request.url));
    }

    // Check if user is admin
    if (token.role !== 'admin') {
      console.log('Not admin, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Admin access granted');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 