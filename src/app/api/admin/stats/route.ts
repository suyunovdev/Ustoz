/**
 * GET /api/admin/stats
 * Admin dashboard KPI'lari.
 * Auth: admin only.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getDashboardStats } from '@/lib/services/admin-stats.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const stats = await getDashboardStats();
    return jsonResponse(stats);
  } catch (err) {
    return errorResponse(err);
  }
}
