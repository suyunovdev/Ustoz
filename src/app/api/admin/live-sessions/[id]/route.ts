/**
 * PATCH  /api/admin/live-sessions/[id] — tahrirlash
 * DELETE /api/admin/live-sessions/[id] — o'chirish
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { isUuid } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    if (!isUuid(id)) throw new ValidationError("Noto'g'ri ID");

    let b: Record<string, unknown>;
    try {
      b = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError('JSON formatida xato');
    }

    const data: Record<string, unknown> = {};
    if (typeof b.title === 'string') data.title = b.title.trim();
    if (typeof b.description === 'string') data.description = b.description.trim();
    if (typeof b.subject === 'string') data.subject = b.subject.trim();
    if (typeof b.hostName === 'string') data.hostName = b.hostName.trim();
    if (typeof b.coverImage === 'string') data.coverImage = b.coverImage.trim();
    if (typeof b.meetingUrl === 'string') {
      if (!/^https?:\/\//.test(b.meetingUrl.trim())) throw new ValidationError('Meeting havolasi http(s)');
      data.meetingUrl = b.meetingUrl.trim();
    }
    if (typeof b.startsAt === 'string') {
      const d = new Date(b.startsAt);
      if (Number.isNaN(d.getTime())) throw new ValidationError("Vaqt noto'g'ri");
      data.startsAt = d;
    }
    if (b.durationMin !== undefined && Number.isFinite(Number(b.durationMin))) {
      data.durationMin = Math.max(5, Math.min(600, Number(b.durationMin)));
    }
    if (b.isPublished !== undefined) data.isPublished = Boolean(b.isPublished);

    const updated = await prisma.liveSession.update({ where: { id }, data });
    return jsonResponse({ session: { ...updated, startsAt: updated.startsAt.toISOString() } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    if (!isUuid(id)) throw new ValidationError("Noto'g'ri ID");
    await prisma.liveSession.delete({ where: { id } });
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
