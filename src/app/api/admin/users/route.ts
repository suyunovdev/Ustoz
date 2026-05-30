/**
 * GET /api/admin/users
 * Foydalanuvchilar ro'yxati — admin uchun.
 *
 * Query:
 *   ?role=student|teacher|admin|all   (default: all)
 *   ?search=string                    (email yoki full_name)
 *   ?limit=20                         (1-100)
 *   ?cursor=<userId>                  (oldingi sahifaning oxirgi user.id)
 *
 * Response:
 *   { users: [...], total: number, nextCursor: string | null }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listUsers } from '@/lib/services/user-management.service';
import type { UserRole } from '@/generated/prisma/client';

const VALID_ROLES = new Set(['student', 'teacher', 'admin', 'all']);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const roleRaw = searchParams.get('role') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const role = VALID_ROLES.has(roleRaw) ? (roleRaw as UserRole | 'all') : 'all';

    const result = await listUsers({ role, search, limit, cursor });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
