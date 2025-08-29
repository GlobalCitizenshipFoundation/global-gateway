// This log should appear in your server console if middleware.ts is being loaded by Next.js
console.log("--- middleware.ts file is being loaded! ---");

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Processing request for: ${request.nextUrl.pathname}`);

  // Fix: Explicitly cast the result to 'any' to resolve TypeScript errors
  const client: any = createMiddlewareClient({
    req: request,
    res: NextResponse.next(),
  });
  const supabase = client.supabase;
  const response = client.response;

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  // Define protected routes based on route groups
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isWorkbenchRoute = request.nextUrl.pathname.startsWith('/workbench');
  const isPortalRoute = request.nextUrl.pathname.startsWith('/portal');
  const isPublicRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/error');

  // Redirect unauthenticated users to login for protected routes
  if (!session && (isAdminRoute || isWorkbenchRoute || isPortalRoute)) {
    console.log(`[Middleware] No session for protected route ${request.nextUrl.pathname}. Redirecting to /login`);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect authenticated users from login/public pages to their appropriate dashboard
  if (session && isPublicRoute && request.nextUrl.pathname !== '/error') {
    const userRole = session.user?.user_metadata?.role;
    let dashboardPath = '/portal/home'; // Default for applicant

    if (userRole === 'admin') {
      dashboardPath = '/admin/console';
    } else if (['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
      dashboardPath = '/workbench/desk';
    }
    console.log(`[Middleware] Session found for public route ${request.nextUrl.pathname}. Redirecting to ${dashboardPath} for role ${userRole}`);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = dashboardPath;
    return NextResponse.redirect(redirectUrl);
  }

  // Role-based authorization for protected routes
  if (session) {
    const userRole = session.user?.user_metadata?.role;

    if (isAdminRoute && userRole !== 'admin') {
      console.log(`[Middleware] Unauthorized access to admin route ${request.nextUrl.pathname} for role ${userRole}. Redirecting to /error/403`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/error/403';
      return NextResponse.redirect(redirectUrl);
    }

    if (isWorkbenchRoute && !['admin', 'coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
      console.log(`[Middleware] Unauthorized access to workbench route ${request.nextUrl.pathname} for role ${userRole}. Redirecting to /error/403`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/error/403';
      return NextResponse.redirect(redirectUrl);
    }

    if (isPortalRoute && !['admin', 'coordinator', 'evaluator', 'screener', 'applicant', 'reviewer'].includes(userRole)) {
      console.log(`[Middleware] Unauthorized access to portal route ${request.nextUrl.pathname} for role ${userRole}. Redirecting to /error/403`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/error/403';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If all checks pass, proceed with the request
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};