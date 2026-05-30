/**
 * POST /api/admin/payments/[id]/refund
 * Tranzaksiyani refund qilish.
 *
 * Body: { reason: string }   // kamida 5 belgi
 *
 * Side-effects:
 *   - PaymentTransaction.status → 'refunded'
 *   - Enrollment.isActive → false (kurs ro'yxatidan olib tashlanadi)
 *   - audit_logs: 'payment.refund'
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  processRefund,
  TransactionNotFoundError,
  NotRefundableError,
} from '@/lib/services/refund.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id: txId } = await params;
    if (!txId) throw new ValidationError("Transaction ID berilmagan");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    if (!body || typeof body !== 'object') {
      throw new ValidationError("Body noto'g'ri");
    }
    const reason = (body as Record<string, unknown>).reason;
    if (typeof reason !== 'string') {
      throw new ValidationError("reason majburiy");
    }

    const updated = await processRefund(session.sub, txId, reason, req);
    return jsonResponse({ transaction: updated });
  } catch (err) {
    if (err instanceof TransactionNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof NotRefundableError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
