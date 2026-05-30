/**
 * POST /api/teacher/groups/[id]/broadcast
 * Body: { title, message }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  broadcastToGroup,
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
    const b = (body ?? {}) as Record<string, unknown>;
    const result = await broadcastToGroup(id, session.sub, {
      title: typeof b.title === 'string' ? b.title : '',
      message: typeof b.message === 'string' ? b.message : '',
    });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
