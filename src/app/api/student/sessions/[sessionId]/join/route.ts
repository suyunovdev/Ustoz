/**
 * POST /api/student/sessions/[sessionId]/join — darsga qo'shilish.
 * A'zolikni tekshiradi, jonli oyna ichida davomatni yozadi, Meet havolasini qaytaradi.
 */

import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { joinSession } from '@/lib/services/group-session.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await requireStudent(req);
    const { sessionId } = await params;
    const result = await joinSession(session.sub, sessionId);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
