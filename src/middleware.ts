import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export async function middleware(request: NextRequest) {
  console.log(`[Dyad Middleware] Request for: ${request.nextUrl.pathname}`);

  const { pathname } = request.nextUrl;

  // Define public paths that do not require authentication
  const publicPaths = [
    '/',
    '/login',
    '/error', // All error pages
    '/simple-test-page', // For general testing
  ];

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path =>
    path === pathname || (path.endsWith('/') && pathname.startsWith(path)) || (path.includes('[code]') && pathname.startsWith('/error/'))
  );

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  // If there's a user session
  if (user) {
    // If an authenticated user tries to access a public path (like /login or /)
    if (isPublicPath && pathname !== '/error') { // Allow authenticated users to see error pages
      const userRole: string = user.user_metadata?.role || '';
      // Redirect to appropriate dashboard based on role
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin/console", request.url));
      } else if (['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
        return NextResponse.redirect(new URL("/workbench/desk", request.url));
      } else {
        return NextResponse.redirect(new URL("/portal/dashboard", request.url));
      }
    }

    // Role-based access control for authenticated users
    const userRole: string = user.user_metadata?.role || '';

    // Admin routes
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL("/error/403", request.url));
    }

    // Workbench routes
    if (pathname.startsWith('/workbench') && !['admin', 'coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
      return NextResponse.redirect(new URL("/error/403", request.url));
    }

    // User Portal routes
    if (pathname.startsWith('/portal') && !['admin', 'coordinator', 'evaluator', 'screener', 'applicant', 'reviewer'].includes(userRole)) {
      return NextResponse.redirect(new URL("/error/403", request.url));
    }

    return NextResponse.next();
  } else {
    // No user session
    // If trying to access a protected path, redirect to login
    if (!isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any files in the /public folder that are not explicitly handled by Next.js routing (e.g., /vercel.svg)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};