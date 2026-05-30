/**
 * GET  /api/conversations/[id]/messages?beforeId=
 * POST /api/conversations/[id]/messages
 *
 * GET — chat tarix (avtomatik mark-as-read)
 * POST — yangi xabar
 *
 * POST Body: { body: string }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listConversationMessages,
  sendMessage,
  ConversationNotFoundError,
  NotParticipantError,
} from '@/lib/services/messaging.service';
import { ValidationError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const beforeId = searchParams.get('beforeId') ?? undefined;
    const result = await listConversationMessages(id, session.sub, beforeId);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof ConversationNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const text = (body as { body?: unknown })?.body;
    if (typeof text !== 'string') throw new ValidationError("body majburiy");

    const message = await sendMessage(id, session.sub, text);
    return jsonResponse({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof ConversationNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof NotParticipantError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
