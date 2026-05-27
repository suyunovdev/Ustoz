'use client';

/**
 * Student Dashboard error boundary.
 * Server component yoki child render xatosida ko'rsatiladi.
 */
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[StudentDashboard ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background pt-24 px-4">
      <div className="max-w-xl mx-auto bg-card rounded-md shadow-warm p-8 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-destructive"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-heading font-bold text-foreground mb-2">
          Xato yuz berdi
        </h2>
        <p className="text-muted-foreground mb-6">
          Dashboard yuklanmadi. Iltimos, qayta urinib ko'ring.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-left bg-muted p-3 rounded mb-4 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}

        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
        >
          Qayta urinish
        </button>
      </div>
    </div>
  );
}
