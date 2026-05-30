/**
 * GET /api/admin/courses
 * Barcha kurslar admin uchun (moderation status filter bilan).
 *
 * Query:
 *   ?status=draft|submitted|under_review|approved|rejected|revision_requested|all
 *   ?search=string
 *   ?featuredOnly=true
 *   ?suspendedOnly=true
 *   ?limit=20
 *   ?cursor=<courseId>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listCourses, VALID_STATUSES } from '@/lib/services/course-moderation.service';
import type { ModerationStatus } from '@/generated/prisma/client';

const ALLOWED_STATUSES = new Set<string>([...VALID_STATUSES, 'all']);

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
    const cursor = searchParams.get('cursor') || undefined;

    const status = ALLOWED_STATUSES.has(statusRaw)
      ? (statusRaw as ModerationStatus | 'all')
      : 'all';

    const result = await listCourses({
      status,
      search,
      featuredOnly,
      suspendedOnly,
      limit,
      cursor,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
