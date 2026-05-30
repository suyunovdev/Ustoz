/**
 * GET /api/admin/campaigns
 *   Yuborilgan kampaniyalar ro'yxati (eng yangi birinchi).
 *
 * POST /api/admin/campaigns
 *   Yangi kampaniya yaratish va darrov yuborish.
 *   Body: { subject, bodyHtml, bodyText?, recipientFilter }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  createAndSend,
  listCampaigns,
} from '@/lib/services/campaign.service';
import { ValidationError } from '@/lib/errors';
import type { RecipientFilter } from '@/lib/repositories';

const VALID_FILTER_TYPES = new Set(['all_users', 'by_role', 'by_course', 'manual']);
const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

function parseRecipientFilter(raw: unknown): RecipientFilter {
  if (!raw || typeof raw !== 'object') {
    throw new ValidationError('recipientFilter noto\'g\'ri');
  }
  const r = raw as Record<string, unknown>;
  const type = r.type;
  if (typeof type !== 'string' || !VALID_FILTER_TYPES.has(type)) {
    throw new ValidationError(`recipientFilter.type noto'g'ri: ${String(type)}`);
  }

  if (type === 'all_users') return { type: 'all_users' };

  if (type === 'by_role') {
    const roles = r.roles;
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new ValidationError('roles bo\'sh');
    }
    const validated = roles.filter(
      (x): x is 'student' | 'teacher' | 'admin' =>
        typeof x === 'string' && VALID_ROLES.has(x),
    );
    if (validated.length === 0) throw new ValidationError("Noto'g'ri rollar");
    return { type: 'by_role', roles: validated };
  }

  if (type === 'by_course') {
    const courseIds = r.courseIds;
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      throw new ValidationError('courseIds bo\'sh');
    }
    const validated = courseIds.filter((x): x is string => typeof x === 'string');
    return { type: 'by_course', courseIds: validated };
  }

  if (type === 'manual') {
    const emails = r.emails;
    if (!Array.isArray(emails) || emails.length === 0) {
      throw new ValidationError('emails bo\'sh');
    }
    const validated = emails.filter(
      (x): x is string => typeof x === 'string' && /.+@.+\..+/.test(x),
    );
    if (validated.length === 0) throw new ValidationError("Email format noto'g'ri");
    return { type: 'manual', emails: validated };
  }

  throw new ValidationError("Noma'lum filter");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const campaigns = await listCampaigns(50);
    return jsonResponse({ campaigns });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!body || typeof body !== 'object') {
      throw new ValidationError("Body bo'sh");
    }
    const b = body as Record<string, unknown>;

    const subject = typeof b.subject === 'string' ? b.subject : '';
    const bodyHtml = typeof b.bodyHtml === 'string' ? b.bodyHtml : '';
    const bodyText = typeof b.bodyText === 'string' ? b.bodyText : undefined;
    const recipientFilter = parseRecipientFilter(b.recipientFilter);

    const campaign = await createAndSend({
      adminId: session.sub,
      subject,
      bodyHtml,
      bodyText,
      recipientFilter,
      request: req,
    });

    return jsonResponse({ campaign });
  } catch (err) {
    return errorResponse(err);
  }
}
