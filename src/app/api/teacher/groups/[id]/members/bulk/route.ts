/**
 * POST /api/teacher/groups/[id]/members/bulk
 * Bir vaqtda bir nechta talabani qo'shish.
 * Body: { studentIds: string[] }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  addGroupMembersBulk,
  GroupAccessDeniedError,
} from '@/lib/services/group.service';
import { ValidationError } from '@/lib/errors';

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
    const ids = (body as { studentIds?: unknown })?.studentIds;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== 'string')) {
      throw new ValidationError("studentIds string array bo'lishi kerak");
    }
    const result = await addGroupMembersBulk(id, session.sub, ids as string[]);
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
