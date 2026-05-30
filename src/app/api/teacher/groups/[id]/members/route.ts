/**
 * GET  /api/teacher/groups/[id]/members
 * POST /api/teacher/groups/[id]/members — bitta talabani qo'shish
 *
 * Body (POST): { studentId: string }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listGroupMembers,
  addGroupMember,
  GroupAccessDeniedError,
  GroupNotFoundError,
  GroupFullError,
  AlreadyMemberError,
  StudentNotEnrolledError,
} from '@/lib/services/group.service';
import { ValidationError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const members = await listGroupMembers(id, session.sub);
    return jsonResponse({ members });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
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
      throw new ValidationError("JSON formatida xato");
    }
    const studentId = (body as { studentId?: unknown })?.studentId;
    if (typeof studentId !== 'string' || !studentId) {
      throw new ValidationError("studentId majburiy");
    }
    const member = await addGroupMember(id, session.sub, studentId);
    return jsonResponse({ member }, { status: 201 });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof GroupNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof GroupFullError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    if (err instanceof AlreadyMemberError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    if (err instanceof StudentNotEnrolledError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
