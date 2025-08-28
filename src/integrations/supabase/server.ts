import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => { // Made createClient async
  const cookieStore = await cookies(); // Await cookies() to ensure correct type

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
            cookieStore.set(name, value, options);
          } catch (error) {
            // The `cookies().set()` method can only be called from a Server Component or Route Handler.
            // This error is typically caught and handled by the middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            // Use cookieStore.delete for removing cookies
            cookieStore.delete(name, options);
          } catch (error) {
            // The `cookies().set()` method can only be called from a Server Component or Route Handler.
            // This error is typically caught and handled by the middleware.
          }
        },
      },
    }
  );
};