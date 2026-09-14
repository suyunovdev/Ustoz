/**
 * GET /api/teacher/sessions/[sessionId]/attendance — darsga qo'shilgan o'quvchilar
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getSessionAttendance } from '@/lib/services/group-session.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { sessionId } = await params;
    const attendance = await getSessionAttendance(session.sub, sessionId);
    return jsonResponse({ attendance });
  } catch (err) {
    return errorResponse(err);
  }
}
