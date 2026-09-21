/**
 * GET /api/admin/users
 * Foydalanuvchilar ro'yxati — admin uchun.
 *
 * Query:
 *   ?role=student|teacher|admin|all   (default: all)
 *   ?search=string                    (email yoki full_name)
 *   ?limit=20                         (sahifa hajmi, 1-100)
 *   ?page=1                           (1-asosli sahifa)
 *   ?sort=createdAt|lastLoginAt|fullName|email|role
 *   ?order=asc|desc                   (default: desc)
 *
 * Response:
 *   { users: [...], total: number }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listUsers } from '@/lib/services/user-management.service';
import type { UserSortField } from '@/lib/repositories';
import type { UserRole } from '@/generated/prisma/client';

const VALID_ROLES = new Set(['student', 'teacher', 'admin', 'all']);
const VALID_SORTS = new Set<UserSortField>([
  'createdAt',
  'lastLoginAt',
  'fullName',
  'email',
  'role',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const roleRaw = searchParams.get('role') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const pageRaw = Number(searchParams.get('page') ?? 1);
    const page = Math.max(1, Number.isFinite(pageRaw) ? Math.floor(pageRaw) : 1);
    const offset = (page - 1) * limit;

    const sortRaw = searchParams.get('sort') as UserSortField | null;
    const sort = sortRaw && VALID_SORTS.has(sortRaw) ? sortRaw : 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

    const role = VALID_ROLES.has(roleRaw) ? (roleRaw as UserRole | 'all') : 'all';

    const result = await listUsers({ role, search, limit, offset, sort, order });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
