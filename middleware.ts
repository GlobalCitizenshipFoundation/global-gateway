import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Temporarily allow all requests to pass through to diagnose routing issues.
  // This bypasses all authentication and authorization logic.
  console.log(`[Middleware] Allowing request for: ${request.nextUrl.pathname}`);
  return NextResponse.next();
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