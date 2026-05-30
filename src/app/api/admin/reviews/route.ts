/**
 * GET /api/admin/reviews
 * Sharhlar ro'yxati admin uchun.
 *
 * Query:
 *   ?status=visible|hidden|reported|all
 *   ?rating=1|2|3|4|5|all
 *   ?search=string
 *   ?limit=20
 *   ?cursor=<reviewId>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listReviews } from '@/lib/services/review-moderation.service';
import type { ReviewStatusFilter } from '@/lib/repositories';

const VALID_STATUSES = new Set<ReviewStatusFilter>([
  'all',
  'visible',
  'hidden',
  'reported',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const ratingRaw = searchParams.get('rating');
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const status = VALID_STATUSES.has(statusRaw as ReviewStatusFilter)
      ? (statusRaw as ReviewStatusFilter)
      : 'all';

    let rating: number | 'all' = 'all';
    if (ratingRaw && ratingRaw !== 'all') {
      const r = Number(ratingRaw);
      if (Number.isInteger(r) && r >= 1 && r <= 5) rating = r;
    }

    const result = await listReviews({ status, rating, search, limit, cursor });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
