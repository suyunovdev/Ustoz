/**
 * GET /api/teacher/earnings/balance
 * Teacher balansi (gross/refunded/net/withdrawn/pending/available).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getBalance } from '@/lib/services/teacher-earnings.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const balance = await getBalance(session.sub);
    return jsonResponse({ balance });
  } catch (err) {
    return errorResponse(err);
  }
}
