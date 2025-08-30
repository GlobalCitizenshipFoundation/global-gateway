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
  console.log(`[Dyad Middleware] User: ${user ? user.id : 'null'}, Error: ${userError ? userError.message : 'none'}`);


  // If there's a user session
  if (user) {
    // If an authenticated user tries to access a public path (like /login or /)
    if (isPublicPath && pathname !== '/error') { // Allow authenticated users to see error pages
      const userRole: string = user.user_metadata?.role || '';
      // Redirect to appropriate dashboard based on role (using correct root paths)
      if (userRole === "admin") {
        console.log(`[Dyad Middleware] Redirecting authenticated user (${userRole}) from ${pathname} to /dashboard`);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else if (['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
        console.log(`[Dyad Middleware] Redirecting authenticated user (${userRole}) from ${pathname} to /desk`);
        return NextResponse.redirect(new URL("/desk", request.url));
      } else { // Default for applicant
        console.log(`[Dyad Middleware] Redirecting authenticated user (${userRole}) from ${pathname} to /home`);
        return NextResponse.redirect(new URL("/home", request.url));
      }
    }

    // Role-based access control for authenticated users (using correct root paths)
    const userRole: string = user.user_metadata?.role || '';

    // Admin routes
    if (pathname.startsWith('/dashboard') && userRole !== 'admin') {
      console.log(`[Dyad Middleware] Unauthorized access for user (${userRole}) to ${pathname}. Redirecting to /error/403`);
      return NextResponse.redirect(new URL("/error/403", request.url));
    }
    if (pathname.startsWith('/users') && userRole !== 'admin') {
      console.log(`[Dyad Middleware] Unauthorized access for user (${userRole}) to ${pathname}. Redirecting to /error/403`);
      return NextResponse.redirect(new URL("/error/403", request.url));
    }
    if (pathname.startsWith('/settings') && userRole !== 'admin') {
      console.log(`[Dyad Middleware] Unauthorized access for user (${userRole}) to ${pathname}. Redirecting to /error/403`);
      return NextResponse.redirect(new URL("/error/403", request.url));
    }

    // Workbench routes
    const workbenchRoles = ['admin', 'coordinator', 'evaluator', 'screener', 'reviewer'];
    const workbenchPaths = ['/desk', '/programs', '/pathway-templates', '/campaigns', '/applications/screening', '/evaluations/my-reviews', '/evaluations', '/scheduling', '/communications/templates', '/reports'];
    if (workbenchPaths.some(path => pathname.startsWith(path)) && !workbenchRoles.includes(userRole)) {
      console.log(`[Dyad Middleware] Unauthorized access for user (${userRole}) to ${pathname}. Redirecting to /error/403`);
      return NextResponse.redirect(new URL("/error/403", request.url));
    }

    // Portal routes
    const portalRoles = ['admin', 'coordinator', 'evaluator', 'screener', 'applicant', 'reviewer'];
    const portalPaths = ['/home', '/my-applications', '/profile'];
    if (portalPaths.some(path => pathname.startsWith(path)) && !portalRoles.includes(userRole)) {
      console.log(`[Dyad Middleware] Unauthorized access for user (${userRole}) to ${pathname}. Redirecting to /error/403`);
      return NextResponse.redirect(new URL("/error/403", request.url));
    }

    console.log(`[Dyad Middleware] Allowing request for ${pathname} for user ${user.id} (${userRole})`);
    return NextResponse.next();
  } else {
    // No user session
    // If trying to access a protected path, redirect to login
    if (!isPublicPath) {
      console.log(`[Dyad Middleware] No user session for protected path ${pathname}. Redirecting to /login`);
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log(`[Dyad Middleware] Allowing public path ${pathname} for unauthenticated user.`);
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