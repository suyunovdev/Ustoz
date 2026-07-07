/**
 * POST /api/reviews/[id]/helpful
 * Sharhni foydali deb belgilash (toggle).
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { courseReviewRepo } from '@/lib/repositories';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: reviewId } = await params;

    const result = await courseReviewRepo.toggleHelpful(reviewId, session.sub);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
