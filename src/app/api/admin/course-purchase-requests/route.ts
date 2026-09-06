/** GET /api/admin/course-purchase-requests?status=pending — kurs sotib olish so'rovlari (admin). */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listCoursePurchaseRequests } from '@/lib/services/course-purchase.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const status = req.nextUrl.searchParams.get('status') ?? 'pending';
    const requests = await listCoursePurchaseRequests(status);
    return jsonResponse({ requests });
  } catch (err) {
    return errorResponse(err);
  }
}
