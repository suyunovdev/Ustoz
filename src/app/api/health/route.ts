import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  // Database ulanishini tekshirish — cold-start'da birinchi ulanish transient
  // muvaffaqiyatsiz bo'lishi mumkin, shuning uchun bir marta qayta urinamiz
  // (aks holda bitta transient xato → 503 va noto'g'ri "degraded" ko'rsatardi).
  let dbOk = false;
  for (let attempt = 0; attempt < 2 && !dbOk; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 250));
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (err) {
      checks.database = { status: 'error', message: String(err) };
    }
  }
  if (dbOk) {
    checks.database = { status: 'ok' };
  } else {
    checks.status = 'degraded';
  }

  // Muhit o'zgaruvchilarini tekshirish
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
  const missingEnv = requiredEnv.filter((key) => !process.env[key]);
  if (missingEnv.length > 0) {
    checks.config = { status: 'error', missing: missingEnv };
    checks.status = 'degraded';
  } else {
    checks.config = { status: 'ok' };
  }

  checks.latency_ms = Date.now() - start;

  const httpStatus = checks.status === 'ok' ? 200 : 503;
  const res = NextResponse.json(checks, { status: httpStatus });
  // 10 sekund cache — tez-tez so'ralmaydi
  res.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
  return res;
}
