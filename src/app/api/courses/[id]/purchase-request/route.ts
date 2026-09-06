/**
 * POST /api/courses/[id]/purchase-request
 * Student pullik kursni "sotib olish" bosganda (to'lov shlyuzi ulanmagan davrda)
 * admin tasdig'iga so'rov yuboradi. Admin tasdiqlagach talaba kursga yoziladi.
 * Body: { paymentMethod? }
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { isUuid } from '@/lib/validation';
import { createCoursePurchaseRequest } from '@/lib/services/course-purchase.service';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireStudent(req);
    const { id: courseId } = await params;
    if (!isUuid(courseId)) throw new ValidationError("Noto'g'ri kurs ID formati");

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const method = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : null;

    const result = await createCoursePurchaseRequest(session.sub, courseId, method);
    return jsonResponse({ request: result }, { status: result.alreadyPending ? 200 : 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
