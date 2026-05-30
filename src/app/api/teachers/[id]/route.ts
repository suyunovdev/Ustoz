/**
 * GET /api/teachers/[id]
 * Public — anonim foydalanuvchi ham ko'rishi mumkin.
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getPublicTeacherProfile,
  ProfileNotFoundError,
} from '@/lib/services/user-profile.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const teacher = await getPublicTeacherProfile(id);
    return jsonResponse({ teacher });
  } catch (err) {
    if (err instanceof ProfileNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
