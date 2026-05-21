// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/courses — Marketplace uchun kurslar
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(50, Number(searchParams.get('limit') || '12'));
  const skip = (page - 1) * limit;
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category');
  const targetAudience = searchParams.get('targetAudience');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sortBy = searchParams.get('sortBy') || 'createdAt';

  const where: any = { isPublished: true };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = category;
  if (targetAudience) where.targetAudience = targetAudience;
  if (minPrice || maxPrice) {
    where.priceUzs = {};
    if (minPrice) where.priceUzs.gte = BigInt(minPrice);
    if (maxPrice) where.priceUzs.lte = BigInt(maxPrice);
  }

  const orderBy: any = {};
  if (sortBy === 'rating') orderBy.rating = 'desc';
  else if (sortBy === 'price_asc') orderBy.priceUzs = 'asc';
  else if (sortBy === 'price_desc') orderBy.priceUzs = 'desc';
  else if (sortBy === 'enrollments') orderBy.enrollmentCount = 'desc';
  else orderBy.createdAt = 'desc';

  const [courses, total] = await Promise.all([
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

  return jsonResponse({
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      coverImage: c.coverImage,
      category: c.category,
      subjectCategory: c.subjectCategory,
      targetAudience: c.targetAudience,
      language: c.language,
      difficultyLevel: c.difficultyLevel,
      priceUzs: c.priceUzs.toString(),
      priceUsd: c.priceUsd.toString(),
      rating: c.rating,
      reviewCount: c.reviewCount,
      enrollmentCount: c._count.enrollments,
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
}
