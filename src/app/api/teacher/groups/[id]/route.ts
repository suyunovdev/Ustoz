/**
 * GET    /api/teacher/groups/[id]
 * PATCH  /api/teacher/groups/[id]
 * DELETE /api/teacher/groups/[id]
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getGroupForTeacher,
  updateGroup,
  deleteGroup,
  GroupNotFoundError,
  GroupAccessDeniedError,
} from '@/lib/services/group.service';
import { ValidationError } from '@/lib/errors';
import type { GroupStatus, GroupColor } from '@/lib/repositories';

const VALID_STATUSES: ReadonlyArray<GroupStatus> = ['active', 'archived'];
const VALID_COLORS: ReadonlyArray<GroupColor> = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
  'pink',
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const group = await getGroupForTeacher(id, session.sub);
    return jsonResponse({ group });
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function PATCH(
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
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const status =
      typeof b.status === 'string' && VALID_STATUSES.includes(b.status as GroupStatus)
        ? (b.status as GroupStatus)
        : undefined;
    const color =
      typeof b.color === 'string' && VALID_COLORS.includes(b.color as GroupColor)
        ? (b.color as GroupColor)
        : undefined;

    const updated = await updateGroup(id, session.sub, {
      name: typeof b.name === 'string' ? b.name : undefined,
      description:
        b.description === null
          ? null
          : typeof b.description === 'string'
          ? b.description
          : undefined,
      courseId:
        b.courseId === null
          ? null
          : typeof b.courseId === 'string'
          ? b.courseId
          : undefined,
      maxMembers: typeof b.maxMembers === 'number' ? b.maxMembers : undefined,
      status,
      meetingUrl:
        b.meetingUrl === null
          ? null
          : typeof b.meetingUrl === 'string'
          ? b.meetingUrl
          : undefined,
      scheduleNote:
        b.scheduleNote === null
          ? null
          : typeof b.scheduleNote === 'string'
          ? b.scheduleNote
          : undefined,
      color,
    });

    return jsonResponse({ group: updated });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    await deleteGroup(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
