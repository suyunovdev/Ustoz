/**
 * GET /api/categories
 *
 * Public — auth talab qilinmaydi.
 * Marketplace filter, CategoryFilter komponenti, recommendation algoritmi uchun.
 *
 * Response:
 *   200 {
 *     categories: [
 *       { id, name, slug, description, iconName, courseCount }
 *     ]
 *   }
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
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

    return jsonResponse({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        iconName: c.iconName,
        courseCount: c._count.courses,
      })),
    });
  } catch (err) {
    console.error('[GET /api/categories]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
