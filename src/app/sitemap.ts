import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

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
      url: `${SITE_URL}/landing-page`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
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
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, updatedAt: true },
      take: 5000,
    });
    courseRoutes = courses.map((c) => ({
      url: `${SITE_URL}/course-details/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // DB mavjud bo'lmasa (build vaqti) — faqat statik route'larni qaytaramiz
  }

  return [...staticRoutes, ...courseRoutes];
}
