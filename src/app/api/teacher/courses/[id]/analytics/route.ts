/**
 * GET /api/teacher/courses/[id]/analytics
 * Bitta kurs uchun detail analytics: KPI, topic funnel, top/struggling students, test/assignment stats.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getCourseAnalytics,
  CourseNotFoundError,
  CourseAccessDeniedError,
} from '@/lib/services/teacher-analytics.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const data = await getCourseAnalytics(id, session.sub);
    return jsonResponse(data);
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof CourseAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
