/**
 * GET /api/conversations/[id]
 * Suhbat ma'lumotlari (hamkor + meta).
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getConversationForUser,
  ConversationNotFoundError,
} from '@/lib/services/messaging.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const conversation = await getConversationForUser(id, session.sub);
    return jsonResponse({ conversation });
  } catch (err) {
    if (err instanceof ConversationNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
