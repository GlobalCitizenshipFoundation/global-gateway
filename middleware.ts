import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log(`[Dyad Middleware Test - ALL ROUTES] Request for: ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

// Removed matcher config to test if middleware runs for all routes
// export const config = {
//   matcher: [
//     '/portal/home',
//   ],
// };