/**
 * GET /api/admin/payments
 * Tranzaksiyalar ro'yxati admin uchun.
 *
 * Query:
 *   ?status=completed|pending|failed|refunded|cancelled|all
 *   ?method=click|payme|all
 *   ?search=string (email, name, course title, merchant_trans_id)
 *   ?limit=20
 *   ?cursor=<txId>
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listTransactions } from '@/lib/services/refund.service';
import type { TransactionStatus, PaymentMethod } from '@/generated/prisma/client';

const VALID_STATUSES = new Set([
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
  'all',
]);
const VALID_METHODS = new Set(['click', 'payme', 'all']);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const { searchParams } = new URL(req.url);
    const statusRaw = searchParams.get('status') ?? 'all';
    const methodRaw = searchParams.get('method') ?? 'all';
    const search = searchParams.get('search')?.trim() || undefined;
    const limitRaw = Number(searchParams.get('limit') ?? 20);
    const limit = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20), 100);
    const cursor = searchParams.get('cursor') || undefined;

    const status = VALID_STATUSES.has(statusRaw)
      ? (statusRaw as TransactionStatus | 'all')
      : 'all';
    const method = VALID_METHODS.has(methodRaw)
      ? (methodRaw as PaymentMethod | 'all')
      : 'all';

    const result = await listTransactions({ status, method, search, limit, cursor });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
