/**
 * Support Ticket repository — `support_tickets` + `support_ticket_messages` jadvallari.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const ticketListInclude = {
  user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  assignedTo: { select: { id: true, fullName: true } },
  _count: { select: { messages: true } },
} satisfies Prisma.SupportTicketInclude;

export type TicketListRow = Prisma.SupportTicketGetPayload<{
  include: typeof ticketListInclude;
}>;

const ticketDetailInclude = {
  user: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
  assignedTo: { select: { id: true, fullName: true, email: true } },
  messages: {
    orderBy: { createdAt: 'asc' } as Prisma.SupportTicketMessageOrderByWithRelationInput,
    include: {
      author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
    },
  },
} satisfies Prisma.SupportTicketInclude;

export type TicketDetailRow = Prisma.SupportTicketGetPayload<{
  include: typeof ticketDetailInclude;
}>;

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_user'
  | 'resolved'
  | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface TicketFilters {
  status?: TicketStatus | 'all';
  priority?: TicketPriority | 'all';
  search?: string;
  assignedToMe?: string; // adminId — faqat shu admin'ga assign qilingan
  limit?: number;
  cursor?: string | null;
}

function buildWhere(filters: TicketFilters): Prisma.SupportTicketWhereInput {
  const { status, priority, search, assignedToMe } = filters;
  return {
    ...(status && status !== 'all' ? { status } : {}),
    ...(priority && priority !== 'all' ? { priority } : {}),
    ...(assignedToMe ? { assignedToId: assignedToMe } : {}),
    ...(search
      ? {
          OR: [
            { subject: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export async function findAllForAdmin(
  filters: TicketFilters = {},
): Promise<TicketListRow[]> {
  const { limit = 20, cursor } = filters;
  return prisma.supportTicket.findMany({
    where: buildWhere(filters),
    include: ticketListInclude,
    orderBy: [{ status: 'asc' }, { lastMessageAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(filters: TicketFilters = {}): Promise<number> {
  return prisma.supportTicket.count({ where: buildWhere(filters) });
}

export async function statusCounts(): Promise<{
  total: number;
  open: number;
  in_progress: number;
  waiting_user: number;
  resolved: number;
  closed: number;
}> {
  const grouped = await prisma.supportTicket.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const counts = { total: 0, open: 0, in_progress: 0, waiting_user: 0, resolved: 0, closed: 0 };
  for (const row of grouped) {
    counts.total += row._count._all;
    if (row.status in counts) {
      (counts as any)[row.status] = row._count._all;
    }
  }
  return counts;
}

export async function findById(id: string): Promise<TicketDetailRow | null> {
  return prisma.supportTicket.findUnique({
    where: { id },
    include: ticketDetailInclude,
  });
}

export async function findByUser(userId: string): Promise<TicketListRow[]> {
  return prisma.supportTicket.findMany({
    where: { userId },
    include: ticketListInclude,
    orderBy: { lastMessageAt: 'desc' },
  });
}

export interface CreateTicketInput {
  userId: string;
  subject: string;
  category: string;
  priority?: TicketPriority;
  initialMessage: string;
}

export async function createWithInitialMessage(
  input: CreateTicketInput,
): Promise<TicketDetailRow> {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const ticket = await tx.supportTicket.create({
      data: {
        userId: input.userId,
        subject: input.subject,
        category: input.category,
        priority: input.priority ?? 'normal',
        status: 'open',
        lastMessageAt: now,
        lastMessageById: input.userId,
      },
    });
    await tx.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: input.userId,
        isAdminReply: false,
        body: input.initialMessage,
      },
    });
    return tx.supportTicket.findUniqueOrThrow({
      where: { id: ticket.id },
      include: ticketDetailInclude,
    });
  });
}

export async function addMessage(
  data: { ticketId: string; authorId: string; isAdminReply: boolean; body: string },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.supportTicketMessage.create({
    data,
  });
  await client.supportTicket.update({
    where: { id: data.ticketId },
    data: {
      lastMessageAt: new Date(),
      lastMessageById: data.authorId,
      // Agar admin javob bersa → status waiting_user
      // Agar user javob bersa → status in_progress
      status: data.isAdminReply ? 'waiting_user' : 'in_progress',
    },
  });
}

export async function updateStatus(
  ticketId: string,
  data: {
    status: TicketStatus;
    closedAt?: Date | null;
  },
  tx?: Prisma.TransactionClient,
): Promise<TicketDetailRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: data.status,
      closedAt: data.closedAt,
    },
    include: ticketDetailInclude,
  });
}

export async function assign(
  ticketId: string,
  assignedToId: string | null,
  tx?: Prisma.TransactionClient,
): Promise<TicketDetailRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.supportTicket.update({
    where: { id: ticketId },
    data: { assignedToId },
    include: ticketDetailInclude,
  });
}
