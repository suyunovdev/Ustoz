/**
 * PATCH /api/profile/password
 * Parolni almashtirish.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { changePassword, InvalidPasswordError } from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }

    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      throw new ValidationError('currentPassword va newPassword majburiy');
    }

    await changePassword(session.sub, currentPassword, newPassword);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof InvalidPasswordError) {
      return jsonResponse({ error: 'Joriy parol noto\'g\'ri' }, { status: 400 });
    }
    return errorResponse(err);
  }
}
