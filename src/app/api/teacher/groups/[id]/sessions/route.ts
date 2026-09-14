/**
 * GET  /api/teacher/groups/[id]/sessions?upcoming=1  — guruh darslari ro'yxati
 * POST /api/teacher/groups/[id]/sessions             — dars yaratish
 *   body: { mode: 'single', title, startsAt, durationMin, meetingUrl }
 *      yoki { mode: 'series', title, occurrences: string[], durationMin, meetingUrl }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  listGroupSessions,
  createSession,
  createSessionSeries,
} from '@/lib/services/group-session.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const upcomingOnly = new URL(req.url).searchParams.get('upcoming') === '1';
    const sessions = await listGroupSessions(session.sub, id, { upcomingOnly });
    return jsonResponse({ sessions });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const title = typeof b.title === 'string' ? b.title : '';
    const durationMin = typeof b.durationMin === 'number' ? b.durationMin : 60;
    const meetingUrl = typeof b.meetingUrl === 'string' ? b.meetingUrl : '';

    if (b.mode === 'series') {
      const occurrences = Array.isArray(b.occurrences)
        ? b.occurrences.filter((o): o is string => typeof o === 'string')
        : [];
      const created = await createSessionSeries(session.sub, id, {
        title,
        occurrences,
        durationMin,
        meetingUrl,
      });
      return jsonResponse({ sessions: created, count: created.length }, { status: 201 });
    }

    const startsAt = typeof b.startsAt === 'string' ? b.startsAt : '';
    const created = await createSession(session.sub, id, {
      title,
      startsAt,
      durationMin,
      meetingUrl,
    });
    return jsonResponse({ session: created }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
