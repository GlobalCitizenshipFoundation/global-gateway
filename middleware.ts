import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of public routes that do not require authentication
  const publicRoutes: string[] = ['/', '/login', '/auth/callback']; // Add any other public routes here

  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.some((route: string) => pathname.startsWith(route));

  // Create a Supabase client for the middleware
  const supabase = await createClient();

  // Get the user session
  const { data: { session } } = await supabase.auth.getSession();

  // If the user is authenticated
  if (session) {
    const userRole: string = session.user?.user_metadata?.role || ''; // Ensure userRole is a string

    // If an authenticated user tries to access a public route, redirect them to their dashboard
    if (isPublicRoute && pathname !== '/auth/callback') {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (['coordinator', 'evaluator', 'screener'].includes(userRole)) {
        return NextResponse.redirect(new URL('/workbench/dashboard', request.url));
      } else { // Default for applicants or other roles
        return NextResponse.redirect(new URL('/portal/dashboard', request.url));
      }
    }

    // Role-based access control for protected routes
    if (pathname.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url)); // Or a 403 forbidden page
    }
    if (pathname.startsWith('/workbench') && !['coordinator', 'evaluator', 'screener', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/login', request.url)); // Or a 403 forbidden page
    }
    if (pathname.startsWith('/portal') && !['applicant', 'coordinator', 'evaluator', 'screener', 'admin'].includes(userRole)) {
      return NextResponse.redirect(new URL('/login', request.url)); // Or a 403 forbidden page
    }

    // Continue if authenticated and authorized
    return NextResponse.next();
  } else {
    // If the user is not authenticated and tries to access a protected route, redirect to login
    if (!isPublicRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Continue if not authenticated but accessing a public route
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
     * - any files in the /public folder (e.g. /public/vercel.svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};