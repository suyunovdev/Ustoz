/**
 * GET  /api/admin/live-sessions — barcha jonli darslar (admin)
 * POST /api/admin/live-sessions — yangi jonli dars yaratish
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

function serialize(s: {
  id: string; title: string; description: string | null; subject: string | null;
  hostName: string; coverImage: string | null; startsAt: Date; durationMin: number;
  meetingUrl: string; isPublished: boolean;
}) {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    subject: s.subject,
    hostName: s.hostName,
    coverImage: s.coverImage,
    startsAt: s.startsAt.toISOString(),
    durationMin: s.durationMin,
    meetingUrl: s.meetingUrl,
    isPublished: s.isPublished,
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const sessions = await prisma.liveSession.findMany({ orderBy: { startsAt: 'desc' }, take: 200 });
    return jsonResponse({ sessions: sessions.map(serialize) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError('JSON formatida xato');
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const meetingUrl = typeof body.meetingUrl === 'string' ? body.meetingUrl.trim() : '';
    const startsAtRaw = typeof body.startsAt === 'string' ? body.startsAt : '';
    const startsAt = new Date(startsAtRaw);

    if (title.length < 2) throw new ValidationError('Sarlavha kamida 2 belgi');
    if (!/^https?:\/\//.test(meetingUrl)) throw new ValidationError("Meeting havolasi http(s) bo'lishi kerak");
    if (Number.isNaN(startsAt.getTime())) throw new ValidationError("Boshlanish vaqti noto'g'ri");

    const created = await prisma.liveSession.create({
      data: {
        title,
        description: typeof body.description === 'string' ? body.description.trim() : null,
        subject: typeof body.subject === 'string' ? body.subject.trim() : null,
        hostName: typeof body.hostName === 'string' && body.hostName.trim() ? body.hostName.trim() : 'Ustoz',
        coverImage: typeof body.coverImage === 'string' ? body.coverImage.trim() : null,
        startsAt,
        durationMin: Number.isFinite(Number(body.durationMin)) ? Math.max(5, Math.min(600, Number(body.durationMin))) : 60,
        meetingUrl,
        isPublished: body.isPublished === undefined ? true : Boolean(body.isPublished),
        createdById: session.sub,
      },
    });
    return jsonResponse({ session: serialize(created) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
