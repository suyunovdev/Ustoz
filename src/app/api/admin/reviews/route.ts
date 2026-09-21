/**
 * GET /api/admin/reviews
 * Sharhlar ro'yxati admin uchun.
 *
 * Query:
 *   ?status=visible|hidden|reported|all
 *   ?rating=1|2|3|4|5|all
 *   ?search=string
 *   ?limit=20&page=1
 *   ?sort=createdAt|rating|reportCount&order=asc|desc
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listReviews } from '@/lib/services/review-moderation.service';
import type { ReviewStatusFilter, ReviewSortField } from '@/lib/repositories';

const VALID_STATUSES = new Set<ReviewStatusFilter>([
  'all',
  'visible',
  'hidden',
  'reported',
]);
const VALID_SORTS = new Set<ReviewSortField>(['createdAt', 'rating', 'reportCount']);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const ratingRaw = searchParams.get('rating');
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const pageRaw = Number(searchParams.get('page') ?? 1);
    const page = Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1);
    const offset = (page - 1) * limit;

    const sortRaw = searchParams.get('sort') as ReviewSortField | null;
    const sort = sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : 'reportCount';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const status = VALID_STATUSES.has(statusRaw as ReviewStatusFilter)
      ? (statusRaw as ReviewStatusFilter)
      : 'all';

    let rating: number | 'all' = 'all';
    if (ratingRaw && ratingRaw !== 'all') {
      const r = Number(ratingRaw);
      if (Number.isInteger(r) && r >= 1 && r <= 5) rating = r;
    }

    const result = await listReviews({ status, rating, search, limit, offset, sort, order });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
