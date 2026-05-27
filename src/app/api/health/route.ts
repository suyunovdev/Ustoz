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

  // Database ulanishini tekshirish
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (err) {
    checks.database = { status: 'error', message: String(err) };
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
  return NextResponse.json(checks, { status: httpStatus });
}
