/**
 * DELETE /api/admin/groups/[id]
 * Admin istalgan guruhni o'chiradi (egalik cheklovisiz).
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { adminDeleteGroup, ContentNotFoundError } from '@/lib/services/admin-content.service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    await adminDeleteGroup(id);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof ContentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
