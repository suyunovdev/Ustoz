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
import { hasActiveCourseAccess } from '@/lib/services/subscription.service';
import { createPresignedDownload } from '@/lib/storage/r2-client';

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
      // Faol enrollment + (obuna-manbali bo'lsa) obuna hali faol bo'lishi shart.
      allowed = await hasActiveCourseAccess(session.sub, topic.courseId);
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
        r2Key: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        materialType: true,
      },
    });

    // R2'dagi fayllarni DOIMIY public URL o'rniga qisqa muddatli imzolangan URL bilan
    // beramiz (bu route allaqachon enrollment/egalik bilan himoyalangan). Tashqi havolalar
    // (r2Key yo'q) o'z fileUrl'ida qoladi.
    const mapped = await Promise.all(
      materials.map(async (m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        fileUrl: (await createPresignedDownload(m.r2Key, 3600)) ?? m.fileUrl,
        fileName: m.fileName,
        fileSize: m.fileSize != null ? Number(m.fileSize) : null,
        fileType: m.fileType,
        materialType: m.materialType,
      })),
    );

    return jsonResponse({ materials: mapped });
  } catch (err) {
    return errorResponse(err);
  }
}
