/**
 * Email Campaign Service
 * ----------------------
 * Admin broadcast email:
 *   - Recipients aniqlash (filter bo'yicha)
 *   - Resend orqali batch yuborish
 *   - Status va statistika tracking
 *   - Audit log
 *
 * NOTE: Hozircha synchronous send (API request ichida).
 * Kelajak: background job (BullMQ / Inngest) + queue.
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  campaignRepo,
  type CampaignRow,
  type RecipientFilter,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { sendBatch, isResendConfigured } from '@/lib/email/resend-client';
import { log as auditLog } from './audit-log.service';

const MAX_RECIPIENTS_PER_CAMPAIGN = 1000;

interface Recipient {
  email: string;
  fullName: string;
}

async function resolveRecipients(filter: RecipientFilter): Promise<Recipient[]> {
  switch (filter.type) {
    case 'all_users': {
      const rows = await prisma.userProfile.findMany({
        where: { isActive: true, deletedAt: null },
        select: { email: true, fullName: true },
        take: MAX_RECIPIENTS_PER_CAMPAIGN + 1,
      });
      return rows;
    }
    case 'by_role': {
      if (!filter.roles || filter.roles.length === 0) {
        throw new ValidationError("Kamida bitta rol tanlash kerak");
      }
      const rows = await prisma.userProfile.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          role: { in: filter.roles },
        },
        select: { email: true, fullName: true },
        take: MAX_RECIPIENTS_PER_CAMPAIGN + 1,
      });
      return rows;
    }
    case 'by_course': {
      if (!filter.courseIds || filter.courseIds.length === 0) {
        throw new ValidationError('Kamida bitta kurs tanlash kerak');
      }
      const rows = await prisma.enrollment.findMany({
        where: {
          isActive: true,
          courseId: { in: filter.courseIds },
          student: { isActive: true, deletedAt: null },
        },
        distinct: ['studentId'],
        select: {
          student: { select: { email: true, fullName: true } },
        },
        take: MAX_RECIPIENTS_PER_CAMPAIGN + 1,
      });
      return rows.map((r) => r.student);
    }
    case 'manual': {
      if (!filter.emails || filter.emails.length === 0) {
        throw new ValidationError("Email manzillar bo'sh");
      }
      const uniq = Array.from(new Set(filter.emails.map((e) => e.trim().toLowerCase())));
      return uniq.map((email) => ({ email, fullName: email }));
    }
  }
  throw new ValidationError("Noma'lum recipient filter");
}

export async function previewRecipients(filter: RecipientFilter): Promise<{
  count: number;
  capped: boolean;
  sample: Recipient[];
}> {
  const recipients = await resolveRecipients(filter);
  const capped = recipients.length > MAX_RECIPIENTS_PER_CAMPAIGN;
  return {
    count: capped ? MAX_RECIPIENTS_PER_CAMPAIGN : recipients.length,
    capped,
    sample: recipients.slice(0, 5),
  };
}

export interface CreateAndSendInput {
  adminId: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  recipientFilter: RecipientFilter;
  request?: NextRequest;
}

/**
 * Kampaniya yaratadi va darrov yubora boshlaydi.
 * Synchronous — API request ichida tugaydi (kichik recipient list uchun OK).
 */
export async function createAndSend(input: CreateAndSendInput): Promise<CampaignRow> {
  if (!isResendConfigured()) {
    throw new ValidationError(
      "Resend sozlanmagan — RESEND_API_KEY environment'da bo'lishi kerak",
    );
  }
  if (!input.subject || input.subject.trim().length < 3) {
    throw new ValidationError("Subject kamida 3 belgi bo'lishi kerak");
  }
  if (!input.bodyHtml || input.bodyHtml.trim().length < 10) {
    throw new ValidationError("Email matni juda qisqa");
  }

  // 1) Recipients
  const recipients = await resolveRecipients(input.recipientFilter);
  if (recipients.length === 0) {
    throw new ValidationError('Recipients ro\'yxati bo\'sh');
  }
  const limited = recipients.slice(0, MAX_RECIPIENTS_PER_CAMPAIGN);

  // 2) Campaign yaratish (draft holida)
  const campaign = await campaignRepo.create({
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText,
    recipientFilter: input.recipientFilter,
    createdById: input.adminId,
  });

  // 3) Status: sending
  await campaignRepo.updateStatus(campaign.id, {
    status: 'sending',
    totalRecipients: limited.length,
    startedAt: new Date(),
  });

  // 4) Audit log
  await auditLog({
    adminId: input.adminId,
    action: 'campaign.send',
    targetType: 'campaign',
    targetId: campaign.id,
    metadata: {
      subject: input.subject,
      recipientCount: limited.length,
      filterType: input.recipientFilter.type,
    },
    request: input.request,
  });

  // 5) Batch send
  const results = await sendBatch(
    limited.map((r) => ({
      to: r.email,
      subject: input.subject,
      html: input.bodyHtml,
      text: input.bodyText,
    })),
    { concurrency: 10, throttleMs: 100 },
  );

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;
  const errors = results
    .filter((r) => !r.success && r.error)
    .slice(0, 5)
    .map((r) => `${r.to}: ${r.error}`)
    .join('; ');

  const finalStatus = failed === 0 ? 'completed' : sent === 0 ? 'failed' : 'completed';

  return campaignRepo.updateStatus(campaign.id, {
    status: finalStatus,
    sentCount: sent,
    failedCount: failed,
    errorSummary: errors || null,
    completedAt: new Date(),
  });
}

export async function listCampaigns(limit = 50): Promise<CampaignRow[]> {
  return campaignRepo.findRecent(limit);
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  return campaignRepo.findById(id);
}
