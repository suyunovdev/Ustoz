/**
 * GET /api/referrals/earnings?status=&cursor=
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listMyEarnings } from '@/lib/services/referral.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const result = await listMyEarnings(session.sub, { status, cursor });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
