/**
 * POST /api/profile/password
 * Body: { oldPassword, newPassword }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  changePassword,
  InvalidPasswordError,
  ProfileNotFoundError,
} from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const oldPassword = typeof b.oldPassword === 'string' ? b.oldPassword : '';
    const newPassword = typeof b.newPassword === 'string' ? b.newPassword : '';
    if (!oldPassword || !newPassword) {
      throw new ValidationError("oldPassword va newPassword majburiy");
    }
    await changePassword(session.sub, oldPassword, newPassword);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof InvalidPasswordError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 401 });
    }
    if (err instanceof ProfileNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
