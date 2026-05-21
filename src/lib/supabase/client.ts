import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // Guard against SSR - return a mock client during build
  if (typeof window === 'undefined') {
    return null as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split(';').map((cookie) => {
            const [name, ...rest] = cookie.trim().split('=');
            return { name, value: decodeURIComponent(rest.join('=')) };
          });
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${encodeURIComponent(value)}; Path=${options?.path || '/'}; Secure; SameSite=None`;

            if (options?.maxAge) {
              cookieString += `; max-age=${options.maxAge}`;
            }
            if (options?.domain) {
              cookieString += `; domain=${options.domain}`;
            }
            if (options?.expires) {
              cookieString += `; expires=${options.expires}`;
            }

            document.cookie = cookieString;
          });
        },
      },
    }
  );
}