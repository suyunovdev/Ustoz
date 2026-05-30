/**
 * GET /api/courses/[id]/reviews/stats
 * Kurs sharhlari statistikasi: avg rating, distribution, etc.
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getCourseReviewStats } from '@/lib/services/review.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const stats = await getCourseReviewStats(id);
    return jsonResponse({ stats });
  } catch (err) {
    return errorResponse(err);
  }
}
