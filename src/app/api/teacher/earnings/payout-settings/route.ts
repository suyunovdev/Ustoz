/**
 * GET   /api/teacher/earnings/payout-settings
 * PATCH /api/teacher/earnings/payout-settings
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getPayoutSettings,
  updatePayoutSettings,
} from '@/lib/services/teacher-earnings.service';
import { ValidationError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const settings = await getPayoutSettings(session.sub);
    return jsonResponse({ settings });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const settings = await updatePayoutSettings(session.sub, {
      payoutBankName:
        b.payoutBankName === null
          ? null
          : typeof b.payoutBankName === 'string'
          ? b.payoutBankName
          : undefined,
      payoutAccountNumber:
        b.payoutAccountNumber === null
          ? null
          : typeof b.payoutAccountNumber === 'string'
          ? b.payoutAccountNumber
          : undefined,
      payoutRecipientName:
        b.payoutRecipientName === null
          ? null
          : typeof b.payoutRecipientName === 'string'
          ? b.payoutRecipientName
          : undefined,
      payoutCardNumber:
        b.payoutCardNumber === null
          ? null
          : typeof b.payoutCardNumber === 'string'
          ? b.payoutCardNumber
          : undefined,
    });
    return jsonResponse({ settings });
  } catch (err) {
    return errorResponse(err);
  }
}
