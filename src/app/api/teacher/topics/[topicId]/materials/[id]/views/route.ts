/**
 * POST /api/teacher/topics/[topicId]/materials/[id]/views
 *
 * Material ko'rilganini yozish (talaba video/PDF ochganda).
 * Auth — har qanday authenticated user (talaba ham yoza oladi).
 * Anonim foydalanuvchilar uchun studentId=null bo'ladi (ipAddress saqlanadi).
 *
 * Body (ixtiyoriy): { watchSec: number }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse, getClientIp } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { contentMaterialRepo } from '@/lib/repositories';
import { hasActiveCourseAccess } from '@/lib/services/subscription.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const material = await contentMaterialRepo.findById(id);
    if (!material) {
      return jsonResponse({ error: "Material topilmadi", code: 'MATERIAL_NOT_FOUND' }, { status: 404 });
    }

    // Kirish nazorati — recordView'dan OLDIN. Faqat kursga faol kirish huquqiga
    // ega foydalanuvchi (yoki kurs egasi/admin, yoki bepul namuna mavzu) ko'rishni
    // yozadi. Aks holda ko'rilishlar sonini soxta oshirib bo'lardi.
    // (stream-token route:60-66 bilan izchil.) courseId'ni mavzudan olamiz.
    let courseId = material.courseId;
    let isFreePreview = false;
    let ownerTeacherId: string | null = null;
    if (material.topicId) {
      const topic = await prisma.courseTopic.findUnique({
        where: { id: material.topicId },
        select: {
          courseId: true,
          isFreePreview: true,
          course: { select: { teacherId: true } },
        },
      });
      if (topic) {
        courseId = topic.courseId;
        isFreePreview = topic.isFreePreview;
        ownerTeacherId = topic.course.teacherId;
      }
    }
    if (courseId) {
      const isOwner =
        ownerTeacherId === session.sub || material.teacherId === session.sub;
      const isAdmin = session.role === 'admin';
      const hasAccess =
        isOwner || isAdmin ? true : await hasActiveCourseAccess(session.sub, courseId);
      if (!hasAccess && !isOwner && !isAdmin && !isFreePreview) {
        return jsonResponse(
          { error: "Kursga kirish huquqingiz yo'q", code: 'FORBIDDEN' },
          { status: 403 },
        );
      }
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const watchSec =
      body && typeof body === 'object' && typeof (body as Record<string, unknown>).watchSec === 'number'
        ? Math.min(Math.max(Math.floor((body as Record<string, unknown>).watchSec as number), 0), 86400)
        : null;

    await contentMaterialRepo.recordView({
      materialId: id,
      studentId: session.sub,
      watchSec,
      ipAddress: getClientIp(req),
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
