/**
 * GET /api/teacher/dashboard
 * Teacher dashboard ma'lumotlari — KPI, kurslar, daromad, tranzaksiyalar.
 *
 * Refactor: 12 query → 3 raw SQL via service layer.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getTeacherDashboard } from '@/lib/services/teacher-stats.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const data = await getTeacherDashboard(session.sub);
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
