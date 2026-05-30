/**
 * Support Ticket Service
 * ----------------------
 * User: ticket yaratish, ro'yxat, javob yozish (faqat o'z ticket'i)
 * Admin: barcha ticket, javob, status o'zgartirish, assign
 *
 * Status flow:
 *   open → in_progress (admin javob bersa waiting_user)
 *        → waiting_user (admin javob berdi)
 *        → resolved (admin yopdi)
 *        → closed (yakunlangan)
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  ticketRepo,
  type TicketDetailRow,
  type TicketListRow,
  type TicketFilters,
  type TicketStatus,
  type TicketPriority,
} from '@/lib/repositories';
import { ForbiddenError, ValidationError } from '@/lib/errors';
import { log as auditLog } from './audit-log.service';

export class TicketNotFoundError extends Error {
  code = 'TICKET_NOT_FOUND';
  constructor(id: string) {
    super(`Ticket not found: ${id}`);
    this.name = 'TicketNotFoundError';
  }
}

const VALID_CATEGORIES = ['billing', 'technical', 'course', 'account', 'other'];
const VALID_PRIORITIES: ReadonlyArray<TicketPriority> = ['low', 'normal', 'high', 'urgent'];
const VALID_STATUSES: ReadonlyArray<TicketStatus> = [
  'open',
  'in_progress',
  'waiting_user',
  'resolved',
  'closed',
];

export interface ListTicketsResult {
  tickets: TicketListRow[];
  total: number;
  nextCursor: string | null;
  stats: Awaited<ReturnType<typeof ticketRepo.statusCounts>>;
}

export async function listTickets(filters: TicketFilters = {}): Promise<ListTicketsResult> {
  const limit = filters.limit ?? 20;
  const [rows, total, stats] = await Promise.all([
    ticketRepo.findAllForAdmin({ ...filters, limit }),
    ticketRepo.countForAdmin(filters),
    ticketRepo.statusCounts(),
  ]);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    tickets: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    stats,
  };
}

export async function getTicket(
  ticketId: string,
  requesterId: string,
  isAdmin: boolean,
): Promise<TicketDetailRow> {
  const ticket = await ticketRepo.findById(ticketId);
  if (!ticket) throw new TicketNotFoundError(ticketId);
  if (!isAdmin && ticket.userId !== requesterId) {
    throw new ForbiddenError("Bu ticket'ni ko'rish huquqi yo'q");
  }
  return ticket;
}

export async function listUserTickets(userId: string) {
  return ticketRepo.findByUser(userId);
}

interface SubmitTicketInput {
  userId: string;
  subject: string;
  category: string;
  priority?: TicketPriority;
  initialMessage: string;
}

export async function submitTicket(input: SubmitTicketInput): Promise<TicketDetailRow> {
  const subject = input.subject.trim();
  const message = input.initialMessage.trim();
  if (subject.length < 3) throw new ValidationError("Mavzu kamida 3 belgi");
  if (message.length < 10) throw new ValidationError("Xabar kamida 10 belgi");
  if (!VALID_CATEGORIES.includes(input.category)) {
    throw new ValidationError(`Noto'g'ri kategoriya: ${input.category}`);
  }
  if (input.priority && !VALID_PRIORITIES.includes(input.priority)) {
    throw new ValidationError("Noto'g'ri priority");
  }

  return ticketRepo.createWithInitialMessage({
    userId: input.userId,
    subject,
    category: input.category,
    priority: input.priority,
    initialMessage: message,
  });
}

interface ReplyInput {
  ticketId: string;
  authorId: string;
  isAdminReply: boolean;
  body: string;
  request?: NextRequest;
}

export async function replyToTicket(input: ReplyInput): Promise<TicketDetailRow> {
  const body = input.body.trim();
  if (body.length < 1) throw new ValidationError("Bo'sh xabar yuborib bo'lmaydi");

  const ticket = await ticketRepo.findById(input.ticketId);
  if (!ticket) throw new TicketNotFoundError(input.ticketId);

  if (!input.isAdminReply && ticket.userId !== input.authorId) {
    throw new ForbiddenError("Bu ticket'ga javob yozish huquqi yo'q");
  }
  if (ticket.status === 'closed') {
    throw new ValidationError("Yopiq ticket'ga yangi javob yozib bo'lmaydi");
  }

  return prisma.$transaction(async (tx) => {
    await ticketRepo.addMessage(
      {
        ticketId: input.ticketId,
        authorId: input.authorId,
        isAdminReply: input.isAdminReply,
        body,
      },
      tx,
    );

    if (input.isAdminReply) {
      await auditLog(
        {
          adminId: input.authorId,
          action: 'ticket.reply',
          targetType: 'ticket',
          targetId: input.ticketId,
          metadata: { length: body.length },
          request: input.request,
        },
        tx,
      );
    }

    return tx.supportTicket.findUniqueOrThrow({
      where: { id: input.ticketId },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          },
        },
      },
    });
  });
}

export async function changeStatus(
  adminId: string,
  ticketId: string,
  newStatus: TicketStatus,
  request?: NextRequest,
): Promise<TicketDetailRow> {
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new ValidationError(`Noto'g'ri status: ${newStatus}`);
  }
  const target = await ticketRepo.findById(ticketId);
  if (!target) throw new TicketNotFoundError(ticketId);
  if (target.status === newStatus) return target;

  return prisma.$transaction(async (tx) => {
    const updated = await ticketRepo.updateStatus(
      ticketId,
      {
        status: newStatus,
        closedAt: newStatus === 'closed' ? new Date() : newStatus === 'resolved' ? null : null,
      },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: `ticket.status_change`,
        targetType: 'ticket',
        targetId: ticketId,
        metadata: { from: target.status, to: newStatus },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function assignTicket(
  adminId: string,
  ticketId: string,
  assigneeId: string | null,
  request?: NextRequest,
): Promise<TicketDetailRow> {
  const target = await ticketRepo.findById(ticketId);
  if (!target) throw new TicketNotFoundError(ticketId);
  if (target.assignedToId === assigneeId) return target;

  return prisma.$transaction(async (tx) => {
    const updated = await ticketRepo.assign(ticketId, assigneeId, tx);
    await auditLog(
      {
        adminId,
        action: 'ticket.assign',
        targetType: 'ticket',
        targetId: ticketId,
        metadata: { from: target.assignedToId, to: assigneeId },
        request,
      },
      tx,
    );
    return updated;
  });
}

export { VALID_CATEGORIES, VALID_PRIORITIES, VALID_STATUSES };
