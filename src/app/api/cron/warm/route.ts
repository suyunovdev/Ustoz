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
  // Fail-closed: prod'da CRON_SECRET MAJBURIY. O'rnatilgan bo'lsa — faqat to'g'ri
  // Bearer token bilan; prod'da umuman o'rnatilmagan bo'lsa ham rad etamiz (403),
  // shunda himoyasiz endpoint tashqaridan DB'ni bekorga urintirmasin.
  // (subscription-expiry route bilan izchil.) Dev/test'da secret shart emas.
  // (Vercel Cron / UptimeRobot `Authorization: Bearer <secret>` yuboradi.)
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : process.env.NODE_ENV !== 'production';
  if (!authorized) {
    return NextResponse.json({ status: 'forbidden' }, { status: 403 });
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
