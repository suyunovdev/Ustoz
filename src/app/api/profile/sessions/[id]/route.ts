/**
 * DELETE /api/profile/sessions/[id] — bitta qurilmani chiqarish (faqat o'ziniki).
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { revokeSession } from '@/lib/services/session.service';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const ok = await revokeSession(session.sub, id);
    if (!ok) return jsonResponse({ error: 'Sessiya topilmadi' }, { status: 404 });
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
