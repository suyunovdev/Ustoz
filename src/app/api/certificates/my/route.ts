import { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/certificates/my — o'quvchining barcha sertifikatlari
// Faqat student roli — teacher/admin uchun mantiqsiz.
export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);

    const certificates = await prisma.certificate.findMany({
      where: { studentId: session.sub },
      orderBy: { issuedAt: 'desc' },
      include: {
        course: {
          select: {
            title: true,
            coverImage: true,
            teacher: { select: { fullName: true } },
          },
        },
      },
    });

    return jsonResponse({
      certificates: certificates.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        courseTitle: c.course.title,
        courseCoverImage: c.course.coverImage,
        teacherName: c.course.teacher.fullName,
        certificateNumber: c.certificateNumber,
        issuedAt: c.issuedAt,
        verificationUrl: c.verificationUrl,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
