/**
 * POST /api/enrollments/[courseId]/touch
 * Kursga oxirgi kirish vaqtini yangilash (hero card uchun).
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { activityRepo } from '@/lib/repositories';

// Bitta heartbeat'da qabul qilinadigan maksimal daqiqa — abuse'ga qarshi cheklov.
const MAX_MINUTES_PER_CALL = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireStudent(req);
    const { courseId } = await params;

    // Ixtiyoriy heartbeat daqiqalari (o'qishga sarflangan vaqt). Ishonchsiz —
    // 0..MAX oralig'ida qat'iy chegaralanadi.
    let minutes = 0;
    try {
      const body = (await req.json()) as { minutes?: unknown };
      const raw = Number(body?.minutes);
      if (Number.isFinite(raw) && raw > 0) {
        minutes = Math.min(Math.floor(raw), MAX_MINUTES_PER_CALL);
      }
    } catch {
      // tanasiz so'rov — faqat lastAccessedAt yangilanadi
    }

    const updated = await prisma.enrollment.updateMany({
      where: { studentId: session.sub, courseId, isActive: true },
      data: { lastAccessedAt: new Date() },
    });

    // Faqat haqiqatan yozilgan (faol) talaba uchun vaqtni qayd qilamiz.
    if (updated.count > 0 && minutes > 0) {
      await activityRepo.recordMinutes(session.sub, minutes);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
