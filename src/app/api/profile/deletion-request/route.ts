/**
 * POST   /api/profile/deletion-request  — hisob o'chirish so'rovi
 * DELETE /api/profile/deletion-request  — so'rovni bekor qilish
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { requestAccountDeletion, cancelAccountDeletion } from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // body ixtiyoriy
    }
    const reason = typeof body.reason === 'string' ? body.reason : null;
    await requestAccountDeletion(session.sub, reason);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof ValidationError) {
      return jsonResponse({ error: err.message }, { status: 400 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    await cancelAccountDeletion(session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
