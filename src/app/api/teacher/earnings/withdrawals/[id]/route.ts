/**
 * DELETE /api/teacher/earnings/withdrawals/[id]
 * Faqat 'pending' bo'lgan so'rovni teacher o'zi bekor qila oladi.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  cancelMyWithdrawal,
  WithdrawalNotFoundError,
  WithdrawalAccessDeniedError,
  CannotCancelError,
} from '@/lib/services/teacher-earnings.service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const w = await cancelMyWithdrawal(id, session.sub);
    return jsonResponse({ withdrawal: w });
  } catch (err) {
    if (err instanceof WithdrawalNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof WithdrawalAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof CannotCancelError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
