import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return a minimal no-op stub so server components don't crash.
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      }),
    } as any;
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet?.forEach(({ name, value, options }) => {
              const cookieOptions = {
                ...options,
                sameSite: 'none' as const,
                secure: true,
                httpOnly: options?.httpOnly,
                path: options?.path || '/',
              };
              cookieStore.set(name, value, cookieOptions);
            });
          } catch {
            // Handle server component context
          }
        },
      },
    }
  );
}