/**
 * GET /api/teacher/reviews?courseId=&rating=&hasComment=&withoutReply=&sort=&cursor=
 * O'qituvchining barcha sharhlari (yashirilganlar ham).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listTeacherReviews } from '@/lib/services/review.service';

const VALID_SORTS = new Set([
  'newest',
  'oldest',
  'highest_rating',
  'lowest_rating',
  'most_helpful',
]);

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const rating = searchParams.get('rating');
    const hasComment = searchParams.get('hasComment') === 'true' ? true : undefined;
    const withoutReply = searchParams.get('withoutReply') === 'true' ? true : undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const sortParam = searchParams.get('sort') ?? 'newest';
    const sort = VALID_SORTS.has(sortParam) ? (sortParam as any) : 'newest';

    const result = await listTeacherReviews(session.sub, {
      courseId,
      rating: rating ? Number(rating) : undefined,
      hasComment,
      withoutReply,
      cursor,
      sort,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
