/**
 * POST /api/teacher/courses/[id]/broadcast
 * Kursdagi barcha talabalarga bir vaqtda xabar yuborish.
 * Body: { title, message, activeOnly? }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { broadcastToCourse } from '@/lib/services/teacher-student.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const result = await broadcastToCourse(
      id,
      session.sub,
      {
        title: typeof b.title === 'string' ? b.title : '',
        message: typeof b.message === 'string' ? b.message : '',
        courseId: id,
      },
      { activeOnly: typeof b.activeOnly === 'boolean' ? b.activeOnly : true },
    );

    return jsonResponse(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
