/**
 * GET /api/admin/course-moderation?status=submitted|under_review|approved|rejected|revision_requested|all
 * Admin uchun moderatsiya navbatidagi kurslar ro'yxati (default: submitted).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import type { Prisma, ModerationStatus } from '@/generated/prisma/client';

const VALID = new Set([
  'submitted', 'under_review', 'approved', 'rejected', 'revision_requested', 'draft',
]);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const statusRaw = req.nextUrl.searchParams.get('status') ?? 'submitted';

    const where: Prisma.CourseWhereInput = {};
    if (statusRaw !== 'all') {
      if (!VALID.has(statusRaw)) {
        return jsonResponse({ error: "Noto'g'ri status" }, { status: 400 });
      }
      where.moderationStatus = statusRaw as ModerationStatus;
    } else {
      // "all" — moderatsiyaga aloqador holatlar (draft'siz)
      where.moderationStatus = {
        in: ['submitted', 'under_review', 'approved', 'rejected', 'revision_requested'],
      };
    }

    const rows = await prisma.course.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        category: true,
        priceUzs: true,
        moderationStatus: true,
        adminFeedback: true,
        updatedAt: true,
        reviewedAt: true,
        teacherId: true,
        _count: { select: { topics: true } },
        teacher: { select: { fullName: true, email: true } },
      },
    });

    const courses = rows.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      category: c.category,
      priceUzs: c.priceUzs.toString(),
      moderationStatus: c.moderationStatus,
      adminFeedback: c.adminFeedback,
      topicCount: c._count.topics,
      submittedAt: c.updatedAt,
      reviewedAt: c.reviewedAt,
      teacherId: c.teacherId,
      teacherName: c.teacher?.fullName ?? '—',
      teacherEmail: c.teacher?.email ?? '',
    }));

    return jsonResponse({ courses });
  } catch (err) {
    return errorResponse(err);
  }
}
