import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/health — tizim holati tekshiruvi
export async function GET() {
  const start = Date.now();

  const checks: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
  };

  // Database ulanishini tekshirish
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('user_profiles').select('id').limit(1);
    checks.database = error ? { status: 'error', message: error.message } : { status: 'ok' };
  } catch (err) {
    checks.database = { status: 'error', message: String(err) };
    checks.status = 'degraded';
  }

  // Muhit o'zgaruvchilarini tekshirish
  const requiredEnv = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const missingEnv = requiredEnv.filter(key => !process.env[key]);
  if (missingEnv.length > 0) {
    checks.config = { status: 'error', missing: missingEnv };
    checks.status = 'degraded';
  } else {
    checks.config = { status: 'ok' };
  }

  checks.latency_ms = Date.now() - start;

  const httpStatus = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: httpStatus });
}
