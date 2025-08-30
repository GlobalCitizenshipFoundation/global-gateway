import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log(`[Dyad Middleware] Request for: ${request.nextUrl.pathname}`);
  // For now, just log and proceed. We'll add auth logic back once routing is confirmed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Temporarily exclude the /user-portal route group from middleware matching.
    // This is a diagnostic step to see if the middleware is interfering with route group resolution.
    '/((?!user-portal|api|_next/static|_next/image|favicon.ico).*)',
  ],
};