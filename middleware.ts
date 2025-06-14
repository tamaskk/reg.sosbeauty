import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAuthRoute = request.nextUrl.pathname.startsWith('/admin/auth');

  console.log('Middleware Debug:', {
    path: request.nextUrl.pathname,
    hasToken: !!token,
    tokenData: token ? {
      role: token.role,
      email: token.email,
      id: token.id,
      exp: token.exp,
      iat: token.iat
    } : null,
    isAdminRoute,
    isAuthRoute,
    headers: Object.fromEntries(request.headers.entries())
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
      console.log('No token found, redirecting to login');
      return NextResponse.redirect(new URL('/admin/auth/login', request.url));
    }

    // Check if user is admin
    if (token.role !== 'admin') {
      console.log('Token found but role is not admin:', token.role);
      return NextResponse.redirect(new URL('/', request.url));
    }

    console.log('Admin access granted for:', token.email);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 