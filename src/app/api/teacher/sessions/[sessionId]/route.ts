/**
 * PATCH  /api/teacher/sessions/[sessionId]            — darsni tahrirlash
 * DELETE /api/teacher/sessions/[sessionId]?scope=series — darsni (yoki seriyani) bekor qilish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  updateSession,
  cancelSession,
  cancelSeries,
} from '@/lib/services/group-session.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { sessionId } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const updated = await updateSession(session.sub, sessionId, {
      title: typeof b.title === 'string' ? b.title : undefined,
      startsAt: typeof b.startsAt === 'string' ? b.startsAt : undefined,
      durationMin: typeof b.durationMin === 'number' ? b.durationMin : undefined,
      meetingUrl: typeof b.meetingUrl === 'string' ? b.meetingUrl : undefined,
    });
    return jsonResponse({ session: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { sessionId } = await params;
    const scope = new URL(req.url).searchParams.get('scope');

    if (scope === 'series') {
      const res = await cancelSeries(session.sub, sessionId);
      return jsonResponse({ ok: true, cancelled: res.cancelled });
    }
    await cancelSession(session.sub, sessionId);
    return jsonResponse({ ok: true, cancelled: 1 });
  } catch (err) {
    return errorResponse(err);
  }
}
