import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:4028';

/**
 * Sitemap — faqat public sahifalar (auth talab qilmaydigan):
 *   /  /course-marketplace  /about-page  /landing-page  /certificate
 *   + har bir published kurs uchun /course-details/[id]
 *
 * Database o'qiymiz, lekin xato bo'lsa ham asosiy sahifalarni qaytaramiz.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${SITE_URL}/course-marketplace`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about-page`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let courseRoutes: MetadataRoute.Sitemap = [];
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    const query = prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
      take: 5000,
    });
    const courses = await Promise.race([query, timeout]);
    courseRoutes = courses.map((c) => ({
      url: `${SITE_URL}/course-details/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // DB mavjud bo'lmasa yoki timeout — faqat statik route'larni qaytaramiz
  }

  return [...staticRoutes, ...courseRoutes];
}
