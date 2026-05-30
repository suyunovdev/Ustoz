/**
 * POST /api/admin/tickets/[id]/messages
 * Admin javob yuboradi.
 * Body: { body: string }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { replyToTicket, TicketNotFoundError } from '@/lib/services/ticket.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
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
      isAdminReply: true,
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
