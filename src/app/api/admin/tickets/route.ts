/**
 * GET /api/admin/tickets
 * Support ticket'lar ro'yxati.
 *
 * Query:
 *   ?status=open|in_progress|waiting_user|resolved|closed|all
 *   ?priority=low|normal|high|urgent|all
 *   ?search=string
 *   ?assignedToMe=true
 *   ?limit=20
 *   ?cursor=<id>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listTickets } from '@/lib/services/ticket.service';
import type { TicketStatus, TicketPriority } from '@/lib/repositories';

const VALID_STATUSES = new Set<TicketStatus | 'all'>([
  'all',
  'open',
  'in_progress',
  'waiting_user',
  'resolved',
  'closed',
]);
const VALID_PRIORITIES = new Set<TicketPriority | 'all'>([
  'all',
  'low',
  'normal',
  'high',
  'urgent',
]);

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const priorityRaw = searchParams.get('priority') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const status = VALID_STATUSES.has(statusRaw as any)
      ? (statusRaw as TicketStatus | 'all')
      : 'all';
    const priority = VALID_PRIORITIES.has(priorityRaw as any)
      ? (priorityRaw as TicketPriority | 'all')
      : 'all';

    const result = await listTickets({
      status,
      priority,
      search,
      assignedToMe: assignedToMe ? session.sub : undefined,
      limit,
      cursor,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
