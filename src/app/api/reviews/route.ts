import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';
import { checkRateLimit } from '@/lib/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/reviews?courseId=xxx — kurs sharhlari ro'yxati
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) {
    return jsonResponse({ error: 'courseId kiritilmagan' }, { status: 400 });
  }

  if (!UUID_RE.test(courseId)) {
    return jsonResponse({ error: 'courseId formati noto\'g\'ri' }, { status: 400 });
  }

  try {
    const reviews = await prisma.courseReview.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        student: { select: { fullName: true, avatarUrl: true } },
      },
    });

    return jsonResponse({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        helpful_count: r.helpfulCount,
        created_at: r.createdAt,
        student: {
          full_name: r.student.fullName,
          avatar_url: r.student.avatarUrl,
        },
      })),
    });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return jsonResponse({ error: 'Sharhlarni olishda xatolik' }, { status: 500 });
  }
}

// POST /api/reviews — yangi sharh yozish
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  // Rate limiting: 5 sharh / soat
  const rateLimitKey = `review:${session.sub}`;
  const { allowed } = await checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000);
  if (!allowed) {
    return jsonResponse(
      { error: 'Juda ko\'p sharh. 1 soatdan keyin urinib ko\'ring.' },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { courseId, rating, comment } = body;

  // Validation
  if (!courseId || !UUID_RE.test(courseId)) {
    return jsonResponse({ error: 'courseId noto\'g\'ri' }, { status: 400 });
  }

  if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return jsonResponse({ error: 'Reyting 1 dan 5 gacha bo\'lishi kerak' }, { status: 400 });
  }

  if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
    return jsonResponse({ error: 'Izoh 1000 belgidan oshmasligi kerak' }, { status: 400 });
  }

  // Faqat kursga yozilgan o'quvchi sharh yoza oladi
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: session.sub,
        courseId,
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    return jsonResponse(
      { error: 'Faqat kursni sotib olgan o\'quvchilar sharh yoza oladi' },
      { status: 403 }
    );
  }

  try {
    const review = await prisma.courseReview.upsert({
      where: {
        courseId_studentId: {
          courseId,
          studentId: session.sub,
        },
      },
      update: {
        rating: Math.round(rating),
        comment: comment?.trim() || null,
        isVerifiedPurchase: true,
      },
      create: {
        courseId,
        studentId: session.sub,
        rating: Math.round(rating),
        comment: comment?.trim() || null,
        isVerifiedPurchase: true,
      },
    });

    return jsonResponse({ review }, { status: 201 });
  } catch (error) {
    console.error('Review create error:', error);
    return jsonResponse({ error: 'Sharh yozishda xatolik' }, { status: 500 });
  }
}
