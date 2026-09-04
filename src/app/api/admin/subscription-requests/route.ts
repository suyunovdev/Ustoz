/** GET /api/admin/subscription-requests?status=pending — obuna so'rovlari (admin). */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listSubscriptionRequests } from '@/lib/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const status = req.nextUrl.searchParams.get('status') ?? 'pending';
    const requests = await listSubscriptionRequests(status);
    return jsonResponse({ requests });
  } catch (err) {
    return errorResponse(err);
  }
}
