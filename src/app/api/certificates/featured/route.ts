/**
 * GET /api/certificates/featured?limit=4
 *
 * Landing page uchun eng so'nggi haqiqiy sertifikatlar (public, auth talab
 * qilinmaydi) — "O'quvchilar natijalari" bo'limi shu ma'lumotdan quriladi.
 * Soxta ma'lumot yo'q: sertifikat bo'lmasa bo'lim umuman ko'rsatilmaydi.
 * Ismlar sertifikat snapshot'idan olinadi — sertifikat allaqachon
 * verificationUrl orqali ommaviy tekshiriladigan hujjat.
 */

import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawLimit = parseInt(searchParams.get('limit') || '4', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 8) : 4;

  try {
    const certs = await prisma.certificate.findMany({
      where: { status: 'active' },
      orderBy: { issuedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        certificateNumber: true,
        issuedAt: true,
        finalGrade: true,
        completionPercent: true,
        verificationUrl: true,
        studentNameSnapshot: true,
        courseTitleSnapshot: true,
        student: { select: { fullName: true, avatarUrl: true } },
        course: { select: { title: true } },
      },
    });

    const items = certs.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      issuedAt: c.issuedAt,
      finalGrade: c.finalGrade,
      completionPercent: c.completionPercent,
      // Har doim ishlaydigan tekshiruv havolasi: DB'dagi qiymat bo'lmasa
      // sertifikat raqami orqali /verify/[number] sahifasiga.
      verificationUrl: c.verificationUrl || `/verify/${c.certificateNumber}`,
      studentName: c.studentNameSnapshot || c.student.fullName,
      avatarUrl: c.student.avatarUrl,
      courseTitle: c.courseTitleSnapshot || c.course.title,
    }));

    const res = jsonResponse({ certificates: items });
    // 60 sekund CDN cache — stats endpoint bilan izchil.
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch (error) {
    console.error('Featured certificates fetch error:', error);
    return jsonResponse({ certificates: [] }, { status: 200 });
  }
}
