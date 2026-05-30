/**
 * GET /api/conversations
 * Foydalanuvchining inbox ro'yxati (teacher yoki student).
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listInbox, getInboxUnreadCount } from '@/lib/services/messaging.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const [conversations, totalUnread] = await Promise.all([
      listInbox(session.sub, session.role),
      getInboxUnreadCount(session.sub, session.role),
    ]);
    return jsonResponse({ conversations, totalUnread });
  } catch (err) {
    return errorResponse(err);
  }
}
