/**
 * POST /api/admin/campaigns/preview
 * Recipient filter bo'yicha nechta odam tushishini ko'rsatadi.
 * Body: { recipientFilter: RecipientFilter }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { previewRecipients } from '@/lib/services/campaign.service';
import { ValidationError } from '@/lib/errors';
import type { RecipientFilter } from '@/lib/repositories';

const VALID_FILTER_TYPES = new Set(['all_users', 'by_role', 'by_course', 'manual']);
const VALID_ROLES = new Set(['student', 'teacher', 'admin']);

function parseRecipientFilter(raw: unknown): RecipientFilter {
  if (!raw || typeof raw !== 'object') throw new ValidationError("recipientFilter noto'g'ri");
  const r = raw as Record<string, unknown>;
  const type = r.type;
  if (typeof type !== 'string' || !VALID_FILTER_TYPES.has(type)) {
    throw new ValidationError(`recipientFilter.type noto'g'ri`);
  }
  if (type === 'all_users') return { type: 'all_users' };
  if (type === 'by_role') {
    const roles = Array.isArray(r.roles)
      ? r.roles.filter(
          (x): x is 'student' | 'teacher' | 'admin' =>
            typeof x === 'string' && VALID_ROLES.has(x),
        )
      : [];
    if (roles.length === 0) throw new ValidationError("Roles bo'sh");
    return { type: 'by_role', roles };
  }
  if (type === 'by_course') {
    const courseIds = Array.isArray(r.courseIds)
      ? r.courseIds.filter((x): x is string => typeof x === 'string')
      : [];
    if (courseIds.length === 0) throw new ValidationError("CourseIds bo'sh");
    return { type: 'by_course', courseIds };
  }
  if (type === 'manual') {
    const emails = Array.isArray(r.emails)
      ? r.emails.filter((x): x is string => typeof x === 'string' && /.+@.+\..+/.test(x))
      : [];
    if (emails.length === 0) throw new ValidationError("Email format noto'g'ri");
    return { type: 'manual', emails };
  }
  throw new ValidationError("Noma'lum filter");
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const filter = parseRecipientFilter((body as Record<string, unknown>).recipientFilter);
    const preview = await previewRecipients(filter);
    return jsonResponse(preview);
  } catch (err) {
    return errorResponse(err);
  }
}
