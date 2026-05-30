/**
 * DELETE /api/teacher/groups/[id]/members/[studentId]
 * Talabani guruhdan olib tashlash.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  removeGroupMember,
  GroupAccessDeniedError,
} from '@/lib/services/group.service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; studentId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id, studentId } = await params;
    await removeGroupMember(id, session.sub, studentId);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof GroupAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
