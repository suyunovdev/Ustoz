/**
 * GET /api/teacher/courses/[id]/topics/[topicId]/quiz
 * Mavzuning mavjud testini QuizBuilder shaklida qaytaradi (muharrir ochilganda prefill).
 */
import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getTopicQuizQuestions } from '@/lib/services/course-quiz-sync';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;
    const questions = await getTopicQuizQuestions(session.sub, topicId);
    return jsonResponse({ questions });
  } catch (err) {
    return errorResponse(err);
  }
}
