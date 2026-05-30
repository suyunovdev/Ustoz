/**
 * GET /api/admin/teacher-applications
 * Arizalar ro'yxati admin uchun.
 *
 * Query:
 *   ?status=pending|under_review|approved|rejected|all
 *   ?search=string
 *   ?limit=20
 *   ?cursor=<id>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listApplications } from '@/lib/services/teacher-application.service';
import type { ApplicationStatus } from '@/lib/repositories';

const VALID_STATUSES = new Set<ApplicationStatus | 'all'>([
  'all',
  'pending',
  'under_review',
  'approved',
  'rejected',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const status = VALID_STATUSES.has(statusRaw as any)
      ? (statusRaw as ApplicationStatus | 'all')
      : 'all';

    const result = await listApplications({ status, search, limit, cursor });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
