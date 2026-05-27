/**
 * GET /api/student/recommendations?limit=6&exclude=id1,id2,...
 *
 * 60/30/10 personalized — "Yana ko'rsatish" tugmasi uchun.
 *
 * Query:
 *   limit   — default 6, max 20
 *   exclude — comma-separated UUID'lar (allaqachon ko'rsatilganlar)
 *
 * Auth: JWT
 * Response:
 *   200 { recommendations: RecommendedCourse[] }
 *   401 Auth yo'q
 *   500 Server xatosi
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { getRecommendedCourses } from '@/lib/services/recommendation.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse(
      { error: 'Autentifikatsiya talab qilinadi' },
      { status: 401 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const limitRaw = Number(sp.get('limit'));
  const limit = Math.min(
    Math.max(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 6, 1),
    20,
  );

  // exclude=uuid1,uuid2,... — validate har bittasini
  const excludeIds = (sp.get('exclude') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => UUID_RE.test(s));

  try {
    const recommendations = await getRecommendedCourses(session.sub, limit, {
      excludeIds,
    });
    return jsonResponse({ recommendations });
  } catch (err) {
    console.error('[GET /api/student/recommendations]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
