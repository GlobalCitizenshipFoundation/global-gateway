import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, ReadonlyRequestCookies } from 'next/headers'; // Import ReadonlyRequestCookies

export const createClient = () => {
  const cookieStore: ReadonlyRequestCookies = cookies(); // Explicitly type cookieStore

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `cookies().set()` method can only be called from a Server Component or Route Handler.
            // This error is typically caught and handled by the middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `cookies().set()` method can only be called from a Server Component or Route Handler.
            // This error is typically caught and handled by the middleware.
          }
        },
      },
    }
  );
};