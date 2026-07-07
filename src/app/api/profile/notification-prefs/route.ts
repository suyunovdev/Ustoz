/**
 * GET  /api/profile/notification-prefs
 * PATCH /api/profile/notification-prefs
 * Bildirishnoma sozlamalarini olish va yangilash.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { updateNotificationPrefs, getMyProfile } from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const profile = await getMyProfile(session.sub);
    return jsonResponse({ prefs: profile.notificationPrefs ?? {} });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Body noto\'g\'ri');
    }
    const prefs = body as Record<string, boolean>;
    await updateNotificationPrefs(session.sub, prefs);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
