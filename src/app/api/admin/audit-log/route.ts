/**
 * GET /api/admin/audit-log
 * Admin amallarini ko'rsatish.
 *
 * Query:
 *   ?action=user.suspend (contains'da qidiriladi)
 *   ?targetType=user|course|material|...
 *   ?adminId=<uuid>
 *   ?search=string (admin email/ism yoki IP)
 *   ?from=YYYY-MM-DD
 *   ?to=YYYY-MM-DD
 *   ?limit=50
 *   ?cursor=<id>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getRecentActions } from '@/lib/services/audit-log.service';

function parseDate(s: string | null): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);

    const action = searchParams.get('action')?.trim() || undefined;
    const targetType = searchParams.get('targetType')?.trim() || undefined;
    const adminId = searchParams.get('adminId')?.trim() || undefined;
    const search = searchParams.get('search')?.trim() || undefined;
    const fromDate = parseDate(searchParams.get('from'));
    let toDate = parseDate(searchParams.get('to'));
    if (toDate) {
      // To'liq kunni qamrab olish uchun + 1 kun
      toDate = new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1);
    }
    const limitRaw = Number(searchParams.get('limit') ?? 50);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50), 200);
    const cursor = searchParams.get('cursor') || undefined;

    const result = await getRecentActions({
      action,
      targetType,
      adminId,
      search,
      fromDate,
      toDate,
      limit,
      cursor,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
