import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/courses — Teacher kurslar ro'yxati
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const courses = await prisma.course.findMany({
    where: { teacherId: session.sub },
    include: {
      _count: { select: { enrollments: true } },
      topics: { select: { id: true }, orderBy: { orderIndex: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return jsonResponse({
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      isPublished: c.isPublished,
      priceUzs: c.priceUzs.toString(),
      category: c.category,
      subjectCategory: c.subjectCategory,
      targetAudience: c.targetAudience,
      language: c.language,
      difficultyLevel: c.difficultyLevel,
      rating: c.rating,
      reviewCount: c.reviewCount,
      enrollmentCount: c._count.enrollments,
      topicCount: c.topics.length,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  });
}

// POST /api/teacher/courses — Yangi kurs yaratish
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Noto'g'ri so'rov tanasi" }, { status: 400 });
  }
  const {
    title, description, category, targetAudience, subjectCategory,
    gradeLevel, priceUzs, coverImage, language, difficultyLevel, topics,
  } = body as Record<string, any>;

  if (!title || !category || !targetAudience || !subjectCategory || !language) {
    return jsonResponse({ error: 'Majburiy maydonlar to\'ldirilmagan' }, { status: 400 });
  }

  // Narx faqat butun, manfiy bo'lmagan son bo'lishi kerak
  let priceBig: bigint;
  try {
    priceBig = BigInt(priceUzs ?? 0);
    if (priceBig < BigInt(0)) throw new Error('negative');
  } catch {
    return jsonResponse({ error: "Narx noto'g'ri (butun musbat son bo'lishi kerak)" }, { status: 400 });
  }

  let course;
  try {
    course = await prisma.course.create({
    data: {
      teacherId: session.sub,
      title,
      description,
      category,
      targetAudience,
      subjectCategory,
      gradeLevel: gradeLevel ? Number(gradeLevel) : null,
      priceUzs: priceBig,
      coverImage,
      language,
      difficultyLevel,
      topics: topics?.length
        ? {
            createMany: {
              data: topics.map((t: { title: string; duration?: string; content?: string }, i: number) => ({
                title: t.title,
                orderIndex: i + 1,
                duration: t.duration || '0 min',
                content: t.content || '',
              })),
            },
          }
        : undefined,
    },
      include: { topics: true },
    });
  } catch {
    return jsonResponse({ error: "Kursni yaratib bo'lmadi (ma'lumotlar noto'g'ri)" }, { status: 400 });
  }

  return jsonResponse({ course }, { status: 201 });
}
