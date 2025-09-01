import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server'; // Import NextResponse

export const createClient = async (response?: NextResponse) => { // Make response optional
  const cookieStore = await cookies();

  // --- START DYAD ADDITION ---
  console.log("[Supabase Server Client] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Loaded" : "UNDEFINED");
  console.log("[Supabase Server Client] NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Loaded" : "UNDEFINED");
  // --- END DYAD ADDITION ---

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // If a response object is provided, set the cookie on it
          if (response) {
            response.cookies.set({ name, value, ...options });
          } else {
            // Otherwise, try to set it directly (works in Server Components/Route Handlers)
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              // This error is typically caught and handled by the middleware.
              // console.warn("Could not set cookie directly:", error);
            }
          }
        },
        remove(name: string, options: CookieOptions) {
          // If a response object is provided, remove the cookie from it
          if (response) {
            response.cookies.set({ name, value: '', ...options }); // Set with empty value to remove
          } else {
            // Otherwise, try to remove it directly
            try {
              cookieStore.set(name, '', options); // Reverting to use set with empty value for removal
            } catch (error) {
              // console.warn("Could not remove cookie directly:", error);
            }
          }
        },
      },
    }
  );
};