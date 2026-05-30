/**
 * PATCH /api/admin/users/[id]
 *
 * Body (discriminated union):
 *   { action: 'suspend',     reason?: string }
 *   { action: 'activate' }
 *   { action: 'change_role', newRole: 'student' | 'teacher' | 'admin' }
 *
 * Auth: admin only.
 * Side-effects: audit_logs jadval'iga yozadi, transactional.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  applyAction,
  type UserActionPayload,
} from '@/lib/services/user-management.service';
import { ValidationError } from '@/lib/errors';
import type { UserRole } from '@/generated/prisma/client';

const VALID_ACTIONS = ['suspend', 'activate', 'change_role'] as const;
const VALID_ROLES: ReadonlyArray<UserRole> = ['student', 'teacher', 'admin'];

function parseBody(body: unknown): UserActionPayload {
  if (!body || typeof body !== 'object') {
    throw new ValidationError("Body bo'sh yoki noto'g'ri formatda");
  }
  const b = body as Record<string, unknown>;
  const action = b.action;
  if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as any)) {
    throw new ValidationError(`Noto'g'ri amal: ${String(action)}`);
  }

  if (action === 'suspend') {
    const reason = typeof b.reason === 'string' ? b.reason : undefined;
    return { action, reason };
  }
  if (action === 'activate') {
    return { action };
  }
  if (action === 'change_role') {
    const newRole = b.newRole;
    if (typeof newRole !== 'string' || !VALID_ROLES.includes(newRole as UserRole)) {
      throw new ValidationError(`Noto'g'ri rol: ${String(newRole)}`);
    }
    return { action, newRole: newRole as UserRole };
  }
  throw new ValidationError(`Noma'lum amal`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id: userId } = await params;
    if (!userId) {
      throw new ValidationError("User ID berilmagan");
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const payload = parseBody(raw);

    const updated = await applyAction(session.sub, userId, payload, req);
    return jsonResponse({ user: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
