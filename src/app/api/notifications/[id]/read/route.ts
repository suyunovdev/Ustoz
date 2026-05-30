/**
 * POST /api/notifications/[id]/read
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { markRead } from '@/lib/services/notification.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    await markRead(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
