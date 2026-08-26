/**
 * GET /api/live-sessions
 * Talaba uchun jonli darslar jadvali. Meeting havolasi (qo'shilish) faqat faol
 * obunachi uchun ochiladi — obunasiz foydalanuvchi jadvalni ko'radi, lekin
 * havola o'rniga upsell oladi.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { hasActiveSubscription } from '@/lib/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const [sessions, subscribed] = await Promise.all([
      prisma.liveSession.findMany({
        where: { isPublished: true },
        orderBy: { startsAt: 'asc' },
        take: 60,
      }),
      hasActiveSubscription(session.sub),
    ]);

    const now = Date.now();
    const items = sessions.map((s) => {
      const start = s.startsAt.getTime();
      const end = start + s.durationMin * 60 * 1000;
      const isLive = now >= start && now <= end;
      const isPast = now > end;
      return {
        id: s.id,
        title: s.title,
        description: s.description,
        subject: s.subject,
        hostName: s.hostName,
        coverImage: s.coverImage,
        startsAt: s.startsAt.toISOString(),
        durationMin: s.durationMin,
        isLive,
        isPast,
        // Havola faqat obunachi uchun (va o'tib ketmagan darslar uchun)
        meetingUrl: subscribed && !isPast ? s.meetingUrl : null,
      };
    });

    return jsonResponse({ subscribed, sessions: items });
  } catch (err) {
    return errorResponse(err);
  }
}
