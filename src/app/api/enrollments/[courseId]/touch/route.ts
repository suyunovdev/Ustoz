/**
 * POST /api/enrollments/[courseId]/touch
 *
 * Talaba kursni ochganda chaqiriladi (fire-and-forget) — `lastAccessedAt` yangilanadi.
 * Continue Learning hero card eng so'nggi ochilgan kursni ko'rsatishi uchun.
 *
 * Auth: JWT
 * Response:
 *   200 { success: true }
 *   401 Auth yo'q
 *   403 Yozilmagan (yoki isActive=false)
 *   500 Server xatosi
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { enrollmentRepo } from '@/lib/repositories';
import { jsonResponse } from '@/lib/json';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse(
      { error: 'Autentifikatsiya talab qilinadi' },
      { status: 401 },
    );
  }

  const { courseId } = await params;

  try {
    const { count } = await enrollmentRepo.touchEnrollment(session.sub, courseId);
    if (count === 0) {
      return jsonResponse({ error: 'Bu kursga yozilmagansiz' }, { status: 403 });
    }
    return jsonResponse({ success: true });
  } catch (err) {
    console.error('[POST /api/enrollments/[courseId]/touch]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
