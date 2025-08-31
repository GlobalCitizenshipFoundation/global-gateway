import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

export async function middleware(request: NextRequest) {
  console.log(`[Dyad Middleware] RAW Pathname: ${request.nextUrl.pathname}`); // Added raw pathname log

  const { pathname } = request.nextUrl;

  // Define public paths that do not require authentication
  const publicPaths = [
    '/',
    '/login',
    '/simple-test-page', // For general testing
  ];
  // Define public prefix paths (e.g., for dynamic error pages)
  const publicPrefixPaths = [
    '/error/', // All dynamic error pages like /error/403
  ];

  // Check if the current path is an exact public path or starts with a public prefix path
  const isPublicPath = publicPaths.includes(pathname) ||
                       publicPrefixPaths.some(prefix => pathname.startsWith(prefix));

  // Create a response object to modify headers and cookies
  const response = NextResponse.next();

  // Create Supabase client, passing the response object for cookie handling
  const supabase = await createClient(response); // Pass response to createClient

  // Refresh session if expired - this will update the cookies in the response object
  // and also return the current user.
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log(`[Dyad Middleware] User: ${user ? user.id : 'null'}, Error: ${userError ? userError.message : 'none'}`);


  // If there's a user session
  if (user) {
    // Authenticated users are allowed to access public paths.
    // The initial redirect to their dashboard after login is now handled client-side by LoginPage.tsx.
    // If they manually navigate to a public path (like /login), LoginPage.tsx will redirect them.

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
    const workbenchPaths = ['/desk', '/programs', '/pathways', '/campaigns', '/applications/screening', '/evaluations/my-reviews', '/evaluations', '/scheduling', '/communications/templates', '/reports', '/packages'];
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
    return response; // Return the modified response
  } else {
    // No user session
    // If trying to access a protected path, redirect to login
    if (!isPublicPath) {
      console.log(`[Dyad Middleware] No user session for protected path ${pathname}. Redirecting to /login`);
      // Redirect to login, ensuring the response object is used
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
      // Any cookies set by Supabase during the getUser() call (e.g., clearing expired ones)
      // should be propagated. This is handled by passing `response` to `createClient` initially.
      return redirectResponse;
    }
    console.log(`[Dyad Middleware] Allowing public path ${pathname} for unauthenticated user.`);
    return response; // Return the modified response
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