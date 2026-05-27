import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:4028';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin-dashboard',
          '/teacher-dashboard',
          '/student-dashboard',
          '/learning-interface',
          '/quiz-interface',
          '/payment-processing',
          '/payment-method-selection',
          '/payment-success-confirmation',
          '/transaction-history',
          '/content-upload-center',
          '/content-moderation-dashboard',
          '/assignment-management',
          '/assignment-submission-portal',
          '/sequential-test-builder',
          '/course-creation',
          '/group-creation',
          '/login',
          '/register',
          '/forgot-password',
          '/verify',
          '/unauthorized',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
