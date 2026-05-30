/**
 * GET /api/notifications/badge
 * Faqat unread count — bell uchun polling.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getBadge } from '@/lib/services/notification.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const result = await getBadge(session.sub);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
