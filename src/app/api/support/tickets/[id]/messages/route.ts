/**
 * POST /api/support/tickets/[id]/messages
 * User o'z ticket'iga javob yozadi.
 * Body: { body: string }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { replyToTicket, TicketNotFoundError } from '@/lib/services/ticket.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!raw || typeof raw !== 'object') throw new ValidationError("Body bo'sh");
    const body = (raw as Record<string, unknown>).body;
    if (typeof body !== 'string') throw new ValidationError('body majburiy');

    const ticket = await replyToTicket({
      ticketId: id,
      authorId: session.sub,
      isAdminReply: session.role === 'admin',
      body,
      request: req,
    });
    return jsonResponse({ ticket });
  } catch (err) {
    if (err instanceof TicketNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
