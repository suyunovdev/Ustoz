/**
 * GET   /api/admin/tickets/[id]      → to'liq ticket (xabar tarixi bilan)
 * PATCH /api/admin/tickets/[id]
 *   Body:
 *     { action: 'change_status', newStatus: TicketStatus }
 *     { action: 'assign',        assigneeId: string | null }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getTicket,
  changeStatus,
  assignTicket,
  TicketNotFoundError,
  VALID_STATUSES,
} from '@/lib/services/ticket.service';
import { ValidationError } from '@/lib/errors';
import type { TicketStatus } from '@/lib/repositories';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;
    const ticket = await getTicket(id, session.sub, true);
    return jsonResponse({ ticket });
  } catch (err) {
    if (err instanceof TicketNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;
    const action = b.action;

    if (action === 'change_status') {
      const newStatus = b.newStatus;
      if (typeof newStatus !== 'string' || !VALID_STATUSES.includes(newStatus as TicketStatus)) {
        throw new ValidationError(`Noto'g'ri status`);
      }
      const ticket = await changeStatus(session.sub, id, newStatus as TicketStatus, req);
      return jsonResponse({ ticket });
    }

    if (action === 'assign') {
      const assigneeId = b.assigneeId;
      if (assigneeId !== null && typeof assigneeId !== 'string') {
        throw new ValidationError("assigneeId bo'lishi yoki null bo'lishi kerak");
      }
      const ticket = await assignTicket(session.sub, id, assigneeId as string | null, req);
      return jsonResponse({ ticket });
    }

    throw new ValidationError(`Noma'lum amal: ${String(action)}`);
  } catch (err) {
    if (err instanceof TicketNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
