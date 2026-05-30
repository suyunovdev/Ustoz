/**
 * GET /api/tests/[id]/my-attempts
 * Talabaning ushbu testdagi barcha urinishlari ro'yxati.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listMyAttempts } from '@/lib/services/test.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const attempts = await listMyAttempts(id, session.sub);
    return jsonResponse({ attempts });
  } catch (err) {
    return errorResponse(err);
  }
}
