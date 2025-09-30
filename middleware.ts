import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './lib/auth/middleware';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// Define API routes that don't require authentication
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/register',
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/orders',
  '/products',
  '/wallet',
  '/settings',
  '/profile',
];

// Define protected API routes that require authentication
const protectedApiRoutes = [
  '/api/auth/logout',
  '/api/auth/me',
  '/api/orders',
  '/api/products',
  '/api/wallet',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, _next, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('favicon.ico') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route);
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If not a protected route, allow access
  if (!isProtectedRoute && !isProtectedApiRoute) {
    return NextResponse.next();
  }

  // Verify authentication for protected routes
  const user = await verifyAuth(request);

  if (!user) {
    // For API routes, return 401
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user account is active
  if (user.status !== 'ACTIVE') {
    if (isProtectedApiRoute) {
      return NextResponse.json(
        {
          error: 'Account is not active',
          status: user.status,
        },
        { status: 403 }
      );
    }

    // Redirect to account status page
    return NextResponse.redirect(new URL('/account-inactive', request.url));
  }

  // Add user info to request headers for downstream handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.userId);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-role', user.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};