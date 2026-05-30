/**
 * GET  /api/teacher/earnings/withdrawals?status=
 * POST /api/teacher/earnings/withdrawals
 *
 * POST Body:
 *   {
 *     amountUzs: number | string,
 *     method: 'bank_transfer' | 'card',
 *     bankName?, bankAccountNumber?, cardNumber?,
 *     recipientName, note?
 *   }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listMyWithdrawals,
  requestWithdrawal,
  InsufficientBalanceError,
  PendingWithdrawalExistsError,
} from '@/lib/services/teacher-earnings.service';
import { ValidationError } from '@/lib/errors';
import type { WithdrawalStatus, WithdrawalMethod } from '@/lib/repositories';

const VALID_STATUSES: ReadonlyArray<WithdrawalStatus> = [
  'pending',
  'processing',
  'completed',
  'rejected',
  'cancelled',
];

const VALID_METHODS: ReadonlyArray<WithdrawalMethod> = ['bank_transfer', 'card'];

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as WithdrawalStatus)
        ? (statusParam as WithdrawalStatus)
        : undefined;
    const withdrawals = await listMyWithdrawals(session.sub, { status });
    return jsonResponse({ withdrawals });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const method = b.method;
    if (typeof method !== 'string' || !VALID_METHODS.includes(method as WithdrawalMethod)) {
      throw new ValidationError(`Noto'g'ri usul: ${String(method)}`);
    }
    if (
      typeof b.amountUzs !== 'number' &&
      typeof b.amountUzs !== 'string'
    ) {
      throw new ValidationError("amountUzs majburiy");
    }

    const w = await requestWithdrawal(session.sub, {
      amountUzs: b.amountUzs as number | string,
      method: method as WithdrawalMethod,
      bankName: typeof b.bankName === 'string' ? b.bankName : undefined,
      bankAccountNumber:
        typeof b.bankAccountNumber === 'string' ? b.bankAccountNumber : undefined,
      cardNumber: typeof b.cardNumber === 'string' ? b.cardNumber : undefined,
      recipientName:
        typeof b.recipientName === 'string' ? b.recipientName : undefined,
      note: typeof b.note === 'string' ? b.note : undefined,
    });

    return jsonResponse({ withdrawal: w }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    if (err instanceof PendingWithdrawalExistsError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
