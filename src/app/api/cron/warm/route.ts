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
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // CRON_SECRET sozlangan bo'lsa — faqat to'g'ri Bearer token bilan.
  // (Vercel Cron / UptimeRobot `Authorization: Bearer <secret>` yuboradi.)
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

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
