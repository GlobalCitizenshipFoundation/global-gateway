import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Processing request for: ${request.nextUrl.pathname}`);

  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  const publicPaths = ['/', '/login', '/signup', '/error/401', '/error/403', '/error/404', '/error/500'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  // If there's a session error, log it and redirect to login
  if (sessionError) {
    console.error("[Middleware] Supabase session error:", sessionError.message);
    if (!isPublicPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Handle authenticated users
  if (session) {
    const userRole: string = session.user?.user_metadata?.role || 'applicant';
    const requestedPath = request.nextUrl.pathname;

    // Redirect authenticated users from public paths to their dashboard
    if (isPublicPath && requestedPath !== '/error/403' && requestedPath !== '/error/404') {
      const dashboardPath =
        userRole === 'admin' ? '/admin/console' :
        ['coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole) ? '/workbench/desk' :
        '/portal/home';
      
      if (requestedPath !== dashboardPath) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = dashboardPath;
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Enforce role-based access for protected routes
    if (requestedPath.startsWith('/admin') && userRole !== 'admin') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/error/403';
      return NextResponse.redirect(redirectUrl);
    }
    if (requestedPath.startsWith('/workbench') && !['admin', 'coordinator', 'evaluator', 'screener', 'reviewer'].includes(userRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/error/403';
      return NextResponse.redirect(redirectUrl);
    }
    if (requestedPath.startsWith('/portal') && !['admin', 'coordinator', 'evaluator', 'screener', 'reviewer', 'applicant'].includes(userRole)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/error/403';
      return NextResponse.redirect(redirectUrl);
    }

    return response; // User is authenticated and authorized for the path
  }

  // Handle unauthenticated users trying to access protected paths
  if (!session && !isPublicPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response; // Allow access to public paths for unauthenticated users
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};