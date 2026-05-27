import { createBrowserClient } from '@supabase/ssr';

function createFakeSupabaseClient(): any {
  const noUser = { data: { user: null }, error: null };
  const noSession = { data: { session: null }, error: null };
  const emptyList = { data: [], error: null };
  const emptyItem = { data: null, error: null };

  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    upsert: () => builder,
    delete: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    is: () => builder,
    or: () => builder,
    not: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    match: () => builder,
    contains: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () => Promise.resolve(emptyItem),
    maybeSingle: () => Promise.resolve(emptyItem),
    then: (resolve: any) => Promise.resolve(emptyList).then(resolve),
  };

  return {
    auth: {
      getUser: () => Promise.resolve(noUser),
      getSession: () => Promise.resolve(noSession),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase disabled' } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { message: 'Supabase disabled' } }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
      verifyOtp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    },
    from: () => builder,
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase storage disabled' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Supabase storage disabled' } }),
        remove: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
        createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
      unsubscribe: () => {},
    }),
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
}

export function createClient() {
  // Guard against SSR - return a mock client during build
  if (typeof window === 'undefined') {
    return createFakeSupabaseClient();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Project migrated to JWT + Postgres; Supabase is optional (storage only).
  // If env vars are missing, return a fake client that no-ops gracefully.
  if (!url || !anonKey) {
    return createFakeSupabaseClient();
  }

  return createBrowserClient(
    url,
    anonKey,
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
