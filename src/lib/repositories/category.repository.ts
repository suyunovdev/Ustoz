/**
 * Category repository — `categories` jadvali uchun.
 */

import { prisma } from '@/lib/prisma';

export async function findAllActive() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      iconName: true,
      _count: { select: { courses: { where: { isPublished: true } } } },
    },
  });
}

export async function findBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}
