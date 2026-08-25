import { NextRequest } from 'next/server';
import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// Butun, manfiy bo'lmagan songina BigInt'ga aylantiriladi; noto'g'ri input → null (e'tiborsiz)
function toPriceBigInt(raw: string | null): bigint | null {
  if (!raw || !/^\d+$/.test(raw.trim())) return null;
  try {
    return BigInt(raw.trim());
  } catch {
    return null;
  }
}

// GET /api/courses — Marketplace uchun kurslar
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageRaw = Number(searchParams.get('page'));
  const limitRaw = Number(searchParams.get('limit'));
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw >= 1 ? Math.min(50, Math.floor(limitRaw)) : 12;
  const skip = (page - 1) * limit;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category');
  const targetAudience = searchParams.get('targetAudience');
  const minPrice = toPriceBigInt(searchParams.get('minPrice'));
  const maxPrice = toPriceBigInt(searchParams.get('maxPrice'));
  const sortBy = searchParams.get('sortBy') || 'createdAt';

  const where: Prisma.CourseWhereInput = { isPublished: true };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;
  if (targetAudience) where.targetAudience = targetAudience as Prisma.EnumTargetAudienceFilter<"Course">;
  if (minPrice !== null || maxPrice !== null) {
    where.priceUzs = {};
    if (minPrice !== null) where.priceUzs.gte = minPrice;
    if (maxPrice !== null) where.priceUzs.lte = maxPrice;
  }

  const orderBy: Prisma.CourseOrderByWithRelationInput = {};
  if (sortBy === 'rating') orderBy.rating = 'desc';
  else if (sortBy === 'price_asc') orderBy.priceUzs = 'asc';
  else if (sortBy === 'price_desc') orderBy.priceUzs = 'desc';
  else if (sortBy === 'enrollments') orderBy.enrollmentCount = 'desc';
  else orderBy.createdAt = 'desc';

  type CourseRow = Prisma.CourseGetPayload<{
    include: {
      teacher: { select: { fullName: true; avatarUrl: true } };
      _count: { select: { enrollments: true } };
    };
  }>;
  let courses: CourseRow[];
  let total: number;
  try {
    [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          teacher: { select: { fullName: true, avatarUrl: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);
  } catch {
    // Noto'g'ri filtr (masalan yaroqsiz targetAudience) — 400
    return jsonResponse({ error: "Noto'g'ri so'rov parametrlari" }, { status: 400 });
  }

  const res = jsonResponse({
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      // Base64 (data:) muqovani RO'YXAT javobiga QO'SHMAYMIZ — bitta rasm 100KB+
      // bo'lib payload'ni shishirardi. Card default placeholder ko'rsatadi;
      // to'liq muqova faqat kurs tafsiloti (/api/courses/[id]) da qaytadi.
      coverImage: c.coverImage?.startsWith('data:') ? null : c.coverImage,
      category: c.category,
      subjectCategory: c.subjectCategory,
      targetAudience: c.targetAudience,
      language: c.language,
      difficultyLevel: c.difficultyLevel,
      priceUzs: c.priceUzs.toString(),
      priceUsd: c.priceUsd.toString(),
      rating: c.rating,
      reviewCount: c.reviewCount,
      enrollmentCount: c.enrollmentCount,
      teacherName: c.teacher.fullName,
      teacherAvatar: c.teacher.avatarUrl,
      createdAt: c.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
  // Public kurslar — 30 sekund CDN cache
  res.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
  return res;
}
