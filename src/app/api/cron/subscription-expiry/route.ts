/**
 * GET /api/cron/subscription-expiry
 *
 * Kunlik cron (server crontab yoki UptimeRobot `Authorization: Bearer <CRON_SECRET>`):
 *   1. ~3 kun ichida tugaydigan faol obunalar egalariga eslatma bildirishnomasi.
 *      Dedup: [now+2d, now+3d] oynasi — kunlik cron har obunani bir marta tutadi.
 *   2. Muddati o'tgan faol obunalar status='expired' ga o'tkaziladi (gigiyena;
 *      kirish nazorati baribir expiresAt bo'yicha real vaqtda ishlaydi).
 */
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/repositories/notification.repository';

export async function GET(req: NextRequest) {
  // Bu endpoint ma'lumot O'ZGARTIRADI (obuna statusi) va email yuboradi — fail-closed.
  // Prod'da CRON_SECRET MAJBURIY: o'rnatilmagan yoki mos kelmasa — rad etamiz.
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : process.env.NODE_ENV !== 'production';
  if (!authorized) {
    return NextResponse.json({ status: 'unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in2d = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in3d = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    // 1) Tugash arafasidagi obunalar — eslatma
    const expiring = await prisma.subscription.findMany({
      where: { status: 'active', expiresAt: { gte: in2d, lt: in3d } },
      select: { userId: true, expiresAt: true, plan: { select: { name: true } } },
    });
    for (const s of expiring) {
      try {
        await createNotification({
          recipientId: s.userId,
          type: 'payment',
          title: 'Obunangiz tugayapti',
          message: `"${s.plan?.name ?? 'Obuna'}" obunangiz ${s.expiresAt.toLocaleDateString('uz')} da tugaydi. Uzluksiz kirish uchun yangilang.`,
          metadata: { kind: 'subscription_expiry' },
          email: true,
        });
      } catch (e) {
        console.error('[cron/expiry] notify:', e);
      }
    }

    // 2) Muddati o'tgan faol obunalarni 'expired' ga o'tkazish
    const expired = await prisma.subscription.updateMany({
      where: { status: 'active', expiresAt: { lt: now } },
      data: { status: 'expired' },
    });

    return NextResponse.json({
      status: 'ok',
      remindersSent: expiring.length,
      markedExpired: expired.count,
      timestamp: now.toISOString(),
    });
  } catch (e) {
    console.error('[cron/subscription-expiry]', e);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
