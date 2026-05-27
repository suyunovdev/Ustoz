'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * TanStack Query v5 provider.
 *
 * Default'lar:
 *  - staleTime: 60s — 1 daqiqa ichida re-fetch yo'q
 *  - gcTime:    5m  — inactive cache 5 daqiqa saqlanadi
 *  - retry:     1   — failure'dan keyin 1 marta urinish
 *  - refetchOnWindowFocus: faqat prod (dev'da bezovta)
 *
 * `useState(() => ...)` bilan singleton — har render'da yangi client bo'lmaydi.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            refetchOnMount: true,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
