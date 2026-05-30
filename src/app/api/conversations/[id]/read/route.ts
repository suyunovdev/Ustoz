/**
 * POST /api/conversations/[id]/read
 * Foydalanuvchining unread counts'ni 0 ga tushiradi.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { markAsRead } from '@/lib/services/messaging.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    await markAsRead(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
