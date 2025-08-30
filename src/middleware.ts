import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log(`[Dyad Middleware] Request for: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/:path*', // Match all routes to ensure the middleware is hit
  ],
};