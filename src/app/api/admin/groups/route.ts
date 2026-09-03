/**
 * GET /api/admin/groups
 * Barcha guruhlar (barcha o'qituvchilarniki) — admin ko'rinishi.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { adminListGroups } from '@/lib/services/admin-content.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const groups = await adminListGroups();
    return jsonResponse({ groups });
  } catch (err) {
    return errorResponse(err);
  }
}
