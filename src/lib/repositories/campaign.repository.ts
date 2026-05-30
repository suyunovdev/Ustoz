/**
 * Email Campaign repository — `email_campaigns` jadvali uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const campaignInclude = {
  createdBy: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.EmailCampaignInclude;

export type CampaignRow = Prisma.EmailCampaignGetPayload<{
  include: typeof campaignInclude;
}>;

export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'failed';

export interface RecipientFilter {
  type: 'all_users' | 'by_role' | 'by_course' | 'manual';
  roles?: Array<'student' | 'teacher' | 'admin'>;
  courseIds?: string[];
  emails?: string[];
}

export interface CreateCampaignInput {
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  recipientFilter: RecipientFilter;
  createdById: string;
}

export async function create(input: CreateCampaignInput): Promise<CampaignRow> {
  return prisma.emailCampaign.create({
    data: {
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText ?? null,
      recipientFilter: input.recipientFilter as unknown as Prisma.InputJsonValue,
      createdById: input.createdById,
    },
    include: campaignInclude,
  });
}

export async function findRecent(limit = 50): Promise<CampaignRow[]> {
  return prisma.emailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: campaignInclude,
  });
}

export async function findById(id: string): Promise<CampaignRow | null> {
  return prisma.emailCampaign.findUnique({
    where: { id },
    include: campaignInclude,
  });
}

export async function updateStatus(
  id: string,
  data: {
    status: CampaignStatus;
    totalRecipients?: number;
    sentCount?: number;
    failedCount?: number;
    errorSummary?: string | null;
    startedAt?: Date;
    completedAt?: Date;
  },
  tx?: Prisma.TransactionClient,
): Promise<CampaignRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.emailCampaign.update({
    where: { id },
    data,
    include: campaignInclude,
  });
}
