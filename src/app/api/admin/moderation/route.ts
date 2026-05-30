/**
 * GET /api/admin/moderation
 *   Moderation queue ro'yxati.
 *
 * Query:
 *   ?status=submitted|under_review|approved|rejected|revision_requested|all
 *   ?contentType=document|video|audio|external_link|all
 *   ?search=string
 *   ?limit=20
 *   ?cursor=<queueId>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listQueue } from '@/lib/services/content-moderation.service';
import type { ModerationStatusFilter } from '@/lib/repositories';

const VALID_STATUSES = new Set<ModerationStatusFilter>([
  'all',
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'revision_requested',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const contentType = searchParams.get('contentType') ?? undefined;
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const status = VALID_STATUSES.has(statusRaw as any)
      ? (statusRaw as ModerationStatusFilter)
      : 'all';

    const result = await listQueue({
      status,
      contentType: contentType && contentType !== 'all' ? contentType : 'all',
      search,
      limit,
      cursor,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
