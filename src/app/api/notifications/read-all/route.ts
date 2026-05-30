/**
 * POST /api/notifications/read-all
 * Foydalanuvchining barcha unread'larini read qiladi.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { markAllRead } from '@/lib/services/notification.service';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const result = await markAllRead(session.sub);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
