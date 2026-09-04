/** GET /api/subscriptions/my — joriy foydalanuvchining faol obunasi. */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getActiveSubscription, getPendingRequest } from '@/lib/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const [subscription, pendingRequest] = await Promise.all([
      getActiveSubscription(session.sub),
      getPendingRequest(session.sub),
    ]);
    return jsonResponse({ subscription, pendingRequest });
  } catch (err) {
    return errorResponse(err);
  }
}
