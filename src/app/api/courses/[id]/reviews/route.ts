/**
 * GET  /api/courses/[id]/reviews?rating=&hasComment=&sort=&cursor=
 * POST /api/courses/[id]/reviews — student create/update own review (upsert)
 *
 * Public — anonim ham ko'rishi mumkin (rating/comment ko'rinadi, helpful toggle yo'q).
 * POST faqat enrolled student.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import {
  listCourseReviews,
  upsertOwnReview,
  NotEnrolledError,
} from '@/lib/services/review.service';
import { ValidationError } from '@/lib/errors';

const VALID_SORTS = new Set([
  'newest',
  'oldest',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courseId } = await params;
    const session = await getSessionFromRequest(req); // ixtiyoriy
    const { searchParams } = new URL(req.url);
    const ratingParam = searchParams.get('rating');
    const rating = ratingParam ? Number(ratingParam) : undefined;
    const hasComment = searchParams.get('hasComment') === 'true' ? true : undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const sortParam = searchParams.get('sort') ?? 'newest';
    const sort = VALID_SORTS.has(sortParam) ? (sortParam as any) : 'newest';

    const result = await listCourseReviews(
      courseId,
      { rating, hasComment, cursor, sort },
      session?.sub,
    );
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: courseId } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const rating = typeof b.rating === 'number' ? b.rating : NaN;
    const templateId = typeof b.templateId === 'string' ? b.templateId : undefined;

    const result = await upsertOwnReview(courseId, session.sub, { rating, templateId });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    if (err instanceof NotEnrolledError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
