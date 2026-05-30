/**
 * GET    /api/courses/[id]/reviews/my — talabaning o'z sharhi (yoki null)
 * DELETE /api/courses/[id]/reviews/my — talaba o'z sharhini o'chiradi
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getMyReview,
  deleteOwnReview,
  ReviewAccessDeniedError,
} from '@/lib/services/review.service';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: courseId } = await params;
    const review = await getMyReview(courseId, session.sub);
    return jsonResponse({ review });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: courseId } = await params;
    const existing = await prisma.courseReview.findUnique({
      where: { courseId_studentId: { courseId, studentId: session.sub } },
      select: { id: true },
    });
    if (!existing) {
      return jsonResponse({ error: "Sharh topilmadi", code: 'REVIEW_NOT_FOUND' }, { status: 404 });
    }
    await deleteOwnReview(existing.id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof ReviewAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
