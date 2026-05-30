/**
 * GET /api/admin/audit-log/meta
 * Filter UI uchun: mavjud unique action'lar + target type'lar.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getDistinctActions,
  getDistinctTargetTypes,
} from '@/lib/services/audit-log.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const [actions, targetTypes] = await Promise.all([
      getDistinctActions(),
      getDistinctTargetTypes(),
    ]);
    return jsonResponse({ actions, targetTypes });
  } catch (err) {
    return errorResponse(err);
  }
}
