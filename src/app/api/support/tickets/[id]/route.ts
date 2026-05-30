/**
 * GET /api/support/tickets/[id] — o'z ticket'ini ko'rish
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getTicket, TicketNotFoundError } from '@/lib/services/ticket.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const ticket = await getTicket(id, session.sub, session.role === 'admin');
    return jsonResponse({ ticket });
  } catch (err) {
    if (err instanceof TicketNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
