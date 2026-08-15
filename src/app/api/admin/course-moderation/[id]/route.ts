/**
 * PATCH /api/admin/course-moderation/[id]
 * Admin kursni tasdiqlaydi/rad etadi/qayta ishlashga qaytaradi.
 * Body: { action: 'approve' | 'reject' | 'request_revision', feedback?: string }
 *  - approve          → moderationStatus=approved, isPublished=true (jonli bo'ladi)
 *  - reject           → moderationStatus=rejected,  isPublished=false (feedback majburiy)
 *  - request_revision → moderationStatus=revision_requested (feedback majburiy)
 * Har qaror o'qituvchiga notifikatsiya yuboradi.
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import type { ModerationStatus } from '@/generated/prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const action = String(body.action || '');
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';

    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      throw new ValidationError("action: approve | reject | request_revision");
    }
    if ((action === 'reject' || action === 'request_revision') && !feedback) {
      return jsonResponse(
        { error: 'Rad etish/qayta ishlash uchun sabab (feedback) majburiy', code: 'FEEDBACK_REQUIRED' },
        { status: 400 },
      );
    }

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return jsonResponse({ error: 'Kurs topilmadi', code: 'COURSE_NOT_FOUND' }, { status: 404 });
    }

    const now = new Date();
    let newStatus: ModerationStatus;
    let isPublished: boolean;
    let title: string;
    let message: string;

    if (action === 'approve') {
      newStatus = 'approved';
      isPublished = true;
      title = 'Kursingiz tasdiqlandi ✅';
      message = `"${course.title}" kursi admin tomonidan tasdiqlandi va endi platformada jonli.`;
    } else if (action === 'reject') {
      newStatus = 'rejected';
      isPublished = false;
      title = 'Kursingiz rad etildi';
      message = `"${course.title}" kursi rad etildi. Sabab: ${feedback}`;
    } else {
      newStatus = 'revision_requested';
      isPublished = false;
      title = 'Kursingizga tuzatish so\'raldi';
      message = `"${course.title}" kursi uchun tuzatish so'raldi. Izoh: ${feedback}`;
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        moderationStatus: newStatus,
        isPublished,
        publishedAt: isPublished ? (course.publishedAt ?? now) : course.publishedAt,
        adminFeedback: action === 'approve' ? null : feedback,
        reviewedById: session.sub,
        reviewedAt: now,
      },
    });

    // O'qituvchiga notifikatsiya (best-effort — muvaffaqiyatsizlik qarorni buzmaydi)
    try {
      await prisma.notification.create({
        data: {
          recipientId: course.teacherId,
          senderId: session.sub,
          type: 'course_update',
          title,
          message,
          relatedCourseId: id,
        },
      });
    } catch (e) {
      console.error('[course-moderation] notification failed:', e);
    }

    return jsonResponse({
      course: { ...updated, priceUzs: updated.priceUzs.toString() },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
