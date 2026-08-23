/**
 * GET /api/topics/[topicId]/materials
 * O'quv interfeysi uchun mavzuning materiallari (yuklab olish).
 *
 * Kirish huquqi: shu kursga faol yozilgan talaba, kurs egasi (teacher) yoki admin.
 * Faqat status='active' materiallar qaytadi.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: topicId } = await params;

    const topic = await prisma.courseTopic.findUnique({
      where: { id: topicId },
      select: { id: true, courseId: true, course: { select: { teacherId: true } } },
    });
    if (!topic) {
      return jsonResponse({ error: 'Mavzu topilmadi' }, { status: 404 });
    }

    // Kirish huquqi: admin, kurs egasi teacher, yoki faol enrollment'li talaba.
    const isAdmin = session.role === 'admin';
    const isOwnerTeacher = session.role === 'teacher' && topic.course?.teacherId === session.sub;
    let allowed = isAdmin || isOwnerTeacher;
    if (!allowed) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.sub, courseId: topic.courseId } },
        select: { isActive: true },
      });
      allowed = !!enrollment?.isActive;
    }
    if (!allowed) {
      return jsonResponse({ error: 'Bu materiallarga kirish huquqingiz yo\'q' }, { status: 403 });
    }

    const materials = await prisma.contentMaterial.findMany({
      where: { topicId, status: 'active' },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        materialType: true,
      },
    });

    return jsonResponse({
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileSize: m.fileSize != null ? Number(m.fileSize) : null,
        fileType: m.fileType,
        materialType: m.materialType,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
