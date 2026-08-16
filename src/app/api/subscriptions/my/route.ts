/** GET /api/subscriptions/my — joriy foydalanuvchining faol obunasi. */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getActiveSubscription } from '@/lib/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const subscription = await getActiveSubscription(session.sub);
    return jsonResponse({ subscription });
  } catch (err) {
    return errorResponse(err);
  }
}
