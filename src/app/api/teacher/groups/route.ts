/**
 * GET  /api/teacher/groups?courseId=&status=&search=
 * POST /api/teacher/groups
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { createGroup, listTeacherGroups } from '@/lib/services/group.service';
import { ValidationError } from '@/lib/errors';
import type { GroupColor, GroupStatus } from '@/lib/repositories';

const VALID_COLORS: ReadonlyArray<GroupColor> = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
  'pink',
];

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const status = (searchParams.get('status') as GroupStatus | null) ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const groups = await listTeacherGroups(session.sub, { courseId, status, search });
    return jsonResponse({ groups });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const color =
      typeof b.color === 'string' && VALID_COLORS.includes(b.color as GroupColor)
        ? (b.color as GroupColor)
        : undefined;

    const group = await createGroup(session.sub, {
      name: typeof b.name === 'string' ? b.name : '',
      description: typeof b.description === 'string' ? b.description : undefined,
      courseId: typeof b.courseId === 'string' ? b.courseId : null,
      maxMembers: typeof b.maxMembers === 'number' ? b.maxMembers : undefined,
      meetingUrl: typeof b.meetingUrl === 'string' ? b.meetingUrl : undefined,
      scheduleNote: typeof b.scheduleNote === 'string' ? b.scheduleNote : undefined,
      color,
    });

    return jsonResponse({ group }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
