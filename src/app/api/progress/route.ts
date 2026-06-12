import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/progress?courseId=xxx
// Faqat o'qib olish — studentId har doim session.sub'dan olinadi.
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId talab qilinadi' }, { status: 400 });

  // Unique kompozit kalit orqali izlash — boshqa student'ning yozuvini olish imkonsiz.
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: session.sub, courseId } },
  });

  if (!enrollment) return NextResponse.json({ error: 'Kurs topilmadi' }, { status: 404 });

  return NextResponse.json({
    progress: enrollment.progress,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    isActive: enrollment.isActive,
  });
}

// PATCH /api/progress — OLIB TASHLANGAN (xavfsizlik sababi).
//
// Avval client to'g'ridan-to'g'ri progress qiymatini yuborishi mumkin edi —
// bu student'ga topic tugatmasdan 100% qo'yib, sertifikat olish imkonini berardi.
//
// Endi progress yagona joydan yangilanadi:
//   - POST /api/topics/[id]/complete  — topic tamomlash
//   - POST /api/tests/[id]/submit     — test passlash (birinchi marta +10%)
// Source of truth: topic_completions jadvali.
export async function PATCH() {
  return NextResponse.json(
    {
      error:
        "Bu endpoint olib tashlangan. Progress'ni topic_completions yoki test submit orqali yangilang.",
      code: 'ENDPOINT_REMOVED',
    },
    { status: 410 },
  );
}
