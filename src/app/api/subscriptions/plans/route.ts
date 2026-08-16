/** GET /api/subscriptions/plans — faol obuna planlari (public). */
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listActivePlans } from '@/lib/services/subscription.service';

export async function GET() {
  try {
    const plans = await listActivePlans();
    return jsonResponse({ plans });
  } catch (err) {
    return errorResponse(err);
  }
}
