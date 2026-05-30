/**
 * POST /api/reviews/[id]/helpful
 * Foydalanuvchining "foydali" votini toggle qiladi.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  toggleReviewHelpful,
  ReviewNotFoundError,
} from '@/lib/services/review.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const result = await toggleReviewHelpful(id, session.sub);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof ReviewNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
