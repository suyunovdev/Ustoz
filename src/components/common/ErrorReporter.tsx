'use client';

/**
 * Client xatolarini serverga (/api/client-error) yuboradi — yengil monitoring.
 * Ushlanmagan xatolar va rad etilgan promise'lar prod loglariga tushadi.
 *
 * Himoya: sessiyada ko'pi bilan 10 ta yuboradi va bir xil xabarni takrorlamaydi
 * (xato tsikllarida serverni bosmaslik uchun).
 */
import { useEffect } from 'react';

export default function ErrorReporter() {
  useEffect(() => {
    const seen = new Set<string>();
    let sent = 0;
    const MAX = 10;

    const report = (message: string, stack?: string) => {
      if (sent >= MAX) return;
      const key = message.slice(0, 200);
      if (seen.has(key)) return;
      seen.add(key);
      sent++;
      try {
        const payload = JSON.stringify({ message, stack, url: window.location.href });
        // keepalive — sahifa yopilayotganda ham yetib boradi
        fetch('/api/client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      } catch {
        /* JSON/fetch xatosi — e'tiborsiz (o'zimiz xato yubermaymiz) */
      }
    };

    const onError = (e: ErrorEvent) => {
      report(e.message || 'Unknown error', e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      report(`Unhandled rejection: ${msg}`, reason instanceof Error ? reason.stack : undefined);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
