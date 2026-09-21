/**
 * GET /api/admin/teacher-applications
 * Arizalar ro'yxati admin uchun.
 *
 * Query:
 *   ?status=pending|under_review|approved|rejected|all
 *   ?search=string
 *   ?limit=20&page=1
 *   ?sort=createdAt|fullName&order=asc|desc
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listApplications } from '@/lib/services/teacher-application.service';
import type { ApplicationStatus, ApplicationSortField } from '@/lib/repositories';

const VALID_STATUSES = new Set<ApplicationStatus | 'all'>([
  'all',
  'pending',
  'under_review',
  'approved',
  'rejected',
]);
const VALID_SORTS = new Set<ApplicationSortField>(['createdAt', 'fullName']);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const pageRaw = Number(searchParams.get('page') ?? 1);
    const page = Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1);
    const offset = (page - 1) * limit;

    const sortRaw = searchParams.get('sort') as ApplicationSortField | null;
    const sort = sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const status = VALID_STATUSES.has(statusRaw as ApplicationStatus | 'all')
      ? (statusRaw as ApplicationStatus | 'all')
      : 'all';

    const result = await listApplications({ status, search, limit, offset, sort, order });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
