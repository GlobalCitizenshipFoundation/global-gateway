import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log(`[Dyad Middleware Test] Request for: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/home', // Only match this specific path for now
  ],
};