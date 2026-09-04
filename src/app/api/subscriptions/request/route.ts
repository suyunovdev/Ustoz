/**
 * POST /api/subscriptions/request
 * Student obuna so'rovi yuboradi (to'lov shlyuzi ulanmagan davrda Click/Payme
 * bosilganda). Admin tasdiqlagach obuna faollashadi.
 * Body: { planId, paymentMethod? }
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { createSubscriptionRequest } from '@/lib/services/subscription.service';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const method = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : null;
    if (!planId) throw new ValidationError('planId majburiy');

    const result = await createSubscriptionRequest(session.sub, planId, method);
    return jsonResponse({ request: result }, { status: result.alreadyPending ? 200 : 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
