import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { loadDashboardData } from '@/lib/services/dashboard.service';

// GET /api/enrollments/my — Student dashboard payload (orchestrator service'dan).
// Service ham route handler, ham Server Component (page.tsx prefetch) tomonidan chaqiriladi.
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  try {
    const data = await loadDashboardData(session.sub);
    return jsonResponse(data);
  } catch (err) {
    console.error('[GET /api/enrollments/my]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
