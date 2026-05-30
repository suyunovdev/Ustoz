/**
 * GET  /api/support/tickets — joriy user'ning ticket'lari
 * POST /api/support/tickets — yangi ticket yaratish
 *
 * Body (POST):
 *   { subject, category, priority?, message }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listUserTickets, submitTicket } from '@/lib/services/ticket.service';
import { ValidationError } from '@/lib/errors';
import type { TicketPriority } from '@/lib/repositories';

const VALID_PRIORITIES: ReadonlyArray<TicketPriority> = ['low', 'normal', 'high', 'urgent'];

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const tickets = await listUserTickets(session.sub);
    return jsonResponse({ tickets });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!raw || typeof raw !== 'object') throw new ValidationError("Body bo'sh");
    const b = raw as Record<string, unknown>;

    const subject = typeof b.subject === 'string' ? b.subject : '';
    const category = typeof b.category === 'string' ? b.category : '';
    const message = typeof b.message === 'string' ? b.message : '';
    const priority =
      typeof b.priority === 'string' && VALID_PRIORITIES.includes(b.priority as TicketPriority)
        ? (b.priority as TicketPriority)
        : undefined;

    const ticket = await submitTicket({
      userId: session.sub,
      subject,
      category,
      priority,
      initialMessage: message,
    });
    return jsonResponse({ ticket });
  } catch (err) {
    return errorResponse(err);
  }
}
