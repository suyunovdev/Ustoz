/**
 * GET /api/teachers/[id]/courses
 * Public — o'qituvchining publsihed kurslari.
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listPublicTeacherCourses } from '@/lib/services/user-profile.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const courses = await listPublicTeacherCourses(id);
    return jsonResponse({ courses });
  } catch (err) {
    return errorResponse(err);
  }
}
