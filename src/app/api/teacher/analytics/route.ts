/**
 * GET /api/teacher/analytics?days=30
 * Global statistika — kunlik daromad, taqqoslash, engagement.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getGlobalAnalytics } from '@/lib/services/teacher-analytics.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? Number(daysParam) : 30;
    const data = await getGlobalAnalytics(session.sub, days);
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
