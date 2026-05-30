/**
 * POST   /api/profile/deletion-request — sabab bilan so'rov yuborish
 * DELETE /api/profile/deletion-request — so'rovni bekor qilish
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  requestAccountDeletion,
  cancelAccountDeletion,
} from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const reason =
      body && typeof body === 'object' && typeof (body as any).reason === 'string'
        ? ((body as any).reason as string)
        : null;
    await requestAccountDeletion(session.sub, reason);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    await cancelAccountDeletion(session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
