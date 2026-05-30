/**
 * GET /api/teacher/earnings/payments?status=&courseId=&cursor=
 * To'lovlar tarixi (cursor pagination).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listPayments } from '@/lib/services/teacher-earnings.service';
import type { PaymentStatusFilter } from '@/lib/repositories';

const VALID_STATUSES: ReadonlyArray<PaymentStatusFilter> = [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded',
];

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as PaymentStatusFilter)
        ? (statusParam as PaymentStatusFilter)
        : undefined;
    const courseId = searchParams.get('courseId') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;

    const result = await listPayments(session.sub, { status, courseId, cursor });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
