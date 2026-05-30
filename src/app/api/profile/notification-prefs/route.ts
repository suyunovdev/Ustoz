/**
 * PATCH /api/profile/notification-prefs
 * Body: { email_enrollment?, email_assignment_submission?, ... in_app_enabled? }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { updateNotificationPrefs } from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const prefs = await updateNotificationPrefs(
      session.sub,
      body as Record<string, boolean>,
    );
    return jsonResponse({ prefs });
  } catch (err) {
    return errorResponse(err);
  }
}
