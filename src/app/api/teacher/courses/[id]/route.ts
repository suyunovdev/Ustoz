// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/teacher/courses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const { id } = await params;

  const course = await prisma.course.findFirst({
    where: { id, teacherId: session.sub },
    include: {
      topics: { orderBy: { orderIndex: 'asc' } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });
  }

  return jsonResponse({
    course: {
      ...course,
      priceUzs: course.priceUzs.toString(),
      enrollmentCount: course._count.enrollments,
    },
  });
}

// PATCH /api/teacher/courses/[id] — Kursni tahrirlash
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { id } = await params;

  // Owner tekshirish
  const existing = await prisma.course.findFirst({ where: { id, teacherId: session.sub } });
  if (!existing) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });

  const body = await req.json();
  const {
    title, description, category, targetAudience, subjectCategory,
    gradeLevel, priceUzs, coverImage, language, difficultyLevel,
    isPublished, topics,
  } = body;

  const updated = await prisma.course.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(targetAudience && { targetAudience }),
      ...(subjectCategory && { subjectCategory }),
      ...(gradeLevel !== undefined && { gradeLevel: gradeLevel ? Number(gradeLevel) : null }),
      ...(priceUzs !== undefined && { priceUzs: BigInt(priceUzs) }),
      ...(coverImage !== undefined && { coverImage }),
      ...(language && { language }),
      ...(difficultyLevel !== undefined && { difficultyLevel }),
      ...(isPublished !== undefined && {
        isPublished,
        publishedAt: isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
      }),
    },
  });

  // Topics yangilash (agar yuborilgan bo'lsa)
  if (topics) {
    await prisma.courseTopic.deleteMany({ where: { courseId: id } });
    if (topics.length > 0) {
      await prisma.courseTopic.createMany({
        data: topics.map((t: any, i: number) => ({
          courseId: id,
          title: t.title,
          orderIndex: i + 1,
          duration: t.duration || '0 min',
          content: t.content || '',
          hasQuiz: t.hasQuiz || false,
        })),
      });
    }
  }

  return jsonResponse({ course: { ...updated, priceUzs: updated.priceUzs.toString() } });
}

// DELETE /api/teacher/courses/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.course.findFirst({ where: { id, teacherId: session.sub } });
  if (!existing) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });

  // Enrolled o'quvchilar bo'lsa o'chirishni rad etish
  const enrollmentCount = await prisma.enrollment.count({ where: { courseId: id } });
  if (enrollmentCount > 0) {
    return jsonResponse(
      { error: `${enrollmentCount} ta o'quvchi bu kursda. Avval arxivlang.` },
      { status: 400 }
    );
  }

  await prisma.course.delete({ where: { id } });
  return jsonResponse({ success: true });
}
