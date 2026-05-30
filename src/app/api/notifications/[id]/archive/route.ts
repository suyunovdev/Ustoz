/**
 * POST /api/notifications/[id]/archive
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { archive } from '@/lib/services/notification.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    await archive(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
