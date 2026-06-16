/**
 * GET /api/cron/warm
 *
 * Vercel Cron yoki tashqi service (UptimeRobot) tomonidan har 5 daqiqada
 * chaqiriladi. Serverless function va Neon DB'ni "issiq" tutadi.
 *
 * Bu cold start muammosini hal qiladi:
 * - Vercel function warm bo'ladi (qayta cold start yo'q)
 * - Neon DB ulanishi tirik qoladi (5 daqiqalik timeout'dan oldin)
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();

  try {
    // DB ulanishni tirik tutish uchun oddiy query
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'warm',
      latency_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
