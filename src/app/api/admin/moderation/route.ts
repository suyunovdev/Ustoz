/**
 * GET /api/admin/moderation
 *   Moderation queue ro'yxati.
 *
 * Query:
 *   ?status=submitted|under_review|approved|rejected|revision_requested|all
 *   ?contentType=document|video|audio|external_link|all
 *   ?search=string
 *   ?limit=20&page=1
 *   ?sort=submittedAt&order=asc|desc
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listQueue } from '@/lib/services/content-moderation.service';
import type { ModerationStatusFilter, ModerationSortField } from '@/lib/repositories';

const VALID_STATUSES = new Set<ModerationStatusFilter>([
  'all',
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'revision_requested',
]);
const VALID_SORTS = new Set<ModerationSortField>(['submittedAt']);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const contentType = searchParams.get('contentType') ?? undefined;
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const pageRaw = Number(searchParams.get('page') ?? 1);
    const page = Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1);
    const offset = (page - 1) * limit;

    const sortRaw = searchParams.get('sort') as ModerationSortField | null;
    const sort = sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : 'submittedAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const status = VALID_STATUSES.has(statusRaw as ModerationStatusFilter)
      ? (statusRaw as ModerationStatusFilter)
      : 'all';

    const result = await listQueue({
      status,
      contentType: contentType && contentType !== 'all' ? contentType : 'all',
      search,
      limit,
      offset,
      sort,
      order,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
