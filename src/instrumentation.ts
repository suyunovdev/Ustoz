/**
 * Next.js instrumentation — server ishga tushganda avtomatik chaqiriladi.
 * Bu yerda muhit o'zgaruvchilarini tekshiramiz (fail-closed prod'da).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env');
    validateEnv();
  }
}
