/**
 * GET /api/enrollments/my
 * Student dashboard uchun barcha enrollment ma'lumotlari.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { loadDashboardData } from '@/lib/services/dashboard.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const data = await loadDashboardData(session.sub);
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
