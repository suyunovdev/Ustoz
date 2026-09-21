/**
 * GET /api/admin/courses
 * Barcha kurslar admin uchun (moderation status filter bilan).
 *
 * Query:
 *   ?status=draft|submitted|under_review|approved|rejected|revision_requested|all
 *   ?search=string
 *   ?featuredOnly=true
 *   ?suspendedOnly=true
 *   ?limit=20                (sahifa hajmi, 1-100)
 *   ?page=1                  (1-asosli sahifa)
 *   ?sort=createdAt|priceUzs|enrollmentCount|rating|title
 *   ?order=asc|desc
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listCourses, VALID_STATUSES } from '@/lib/services/course-moderation.service';
import type { CourseSortField } from '@/lib/repositories';
import type { ModerationStatus } from '@/generated/prisma/client';

const ALLOWED_STATUSES = new Set<string>([...VALID_STATUSES, 'all']);
const VALID_SORTS = new Set<CourseSortField>([
  'createdAt',
  'priceUzs',
  'enrollmentCount',
  'rating',
  'title',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    const suspendedOnly = searchParams.get('suspendedOnly') === 'true';
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const pageRaw = Number(searchParams.get('page') ?? 1);
    const page = Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1);
    const offset = (page - 1) * limit;

    const sortRaw = searchParams.get('sort') as CourseSortField | null;
    const sort = sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const status = ALLOWED_STATUSES.has(statusRaw)
      ? (statusRaw as ModerationStatus | 'all')
      : 'all';

    const result = await listCourses({
      status,
      search,
      featuredOnly,
      suspendedOnly,
      limit,
      offset,
      sort,
      order,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
