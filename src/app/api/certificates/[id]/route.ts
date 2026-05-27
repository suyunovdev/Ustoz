import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/certificates/[id] — sertifikat ma'lumotlari (umumiy: verifikatsiya uchun)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return jsonResponse({ error: 'ID kiritilmagan' }, { status: 400 });
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const certificate = await prisma.certificate.findFirst({
    where: uuidRegex.test(id)
      ? { id }
      : { certificateNumber: id.toUpperCase() },
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
      course: {
        select: {
          title: true,
          coverImage: true,
          teacher: { select: { fullName: true } },
        },
      },
    },
  });

  if (!certificate) {
    return jsonResponse({ error: 'Sertifikat topilmadi' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ustoz.uz';

  return jsonResponse({
    certificate: {
      id: certificate.id,
      certificate_number: certificate.certificateNumber,
      issued_at: certificate.issuedAt,
      verification_url: `${appUrl}/verify/${certificate.certificateNumber}`,
      metadata: certificate.metadata,
      student: {
        full_name: certificate.student.fullName,
        avatar_url: certificate.student.avatarUrl,
      },
      course: {
        title: certificate.course.title,
        thumbnail_url: certificate.course.coverImage,
        teacher: {
          full_name: certificate.course.teacher.fullName,
        },
      },
    },
  });
}
