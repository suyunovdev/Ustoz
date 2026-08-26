import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',

  // Standalone output — `.next/standalone` ichida server.js + minimal node_modules
  // (nft tracing). CI'da build qilib, VPS'ga faqat shu artifact ko'chiriladi →
  // VPS'da og'ir `npm install`/`build` yo'q → OOM (exit 137) imkonsiz.
  // `next start` ham ishlayveradi, shuning uchun mavjud deploy'ni buzmaydi.
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Tree-shake katta paket'lar — har bir icon/component'ni alohida import qiladi
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      '@tanstack/react-query',
      'recharts',
    ],
  },

  // Server bundle'ga qo'shilmaydigan paketlar — node_modules'dan to'g'ridan-to'g'ri
  // require qilinadi.
  //  - @prisma/*      : generated TS graph'ni RSC bundle'iga kiritmaslik uchun
  //  - isomorphic-dompurify / jsdom : jsdom o'zining `default-stylesheet.css`
  //    faylini nisbiy yo'l orqali o'qiydi; bundle qilinsa Next uni
  //    `.next/`ga ko'chirmaydi va prerender'da ENOENT beradi. Extern qilib
  //    node_modules'da qoldiramiz.
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'isomorphic-dompurify',
    'jsdom',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'img.rocket.new',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },

  // Landing page endi ROOT (/) da — eski /landing-page URL'ini kanonik / ga
  // 308 (permanent) redirect (SEO + bookmark/tashqi havolalar uchun).
  async redirects() {
    return [
      { source: '/landing-page', destination: '/', permanent: true },
      // Eski sertifikatlar route'i → yangi nom (xatcho'p/eski havolalar 404 bo'lmasligi uchun)
      { source: '/certificates', destination: '/student-certificates', permanent: true },
    ];
  },

  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    // HSTS faqat HTTPS mavjud bo'lganda, CSP production'da
    const isHttps = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
    if (isHttps) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      });
    }
    if (!isDev) {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' data:",
          "img-src 'self' data: blob: https:",
          "connect-src 'self' https://api.resend.com https://my.click.uz https://checkout.paycom.uz https://*.r2.cloudflarestorage.com",
          "media-src 'self' blob: https://*.cloudflarestream.com https://*.r2.cloudflarestorage.com https://*.r2.dev",
          "frame-src 'self' https://customer-*.cloudflarestream.com https://www.youtube.com https://player.vimeo.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self' https://my.click.uz https://checkout.paycom.uz",
        ].join('; '),
      });
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Static sahifalar uchun CDN cache
      {
        source: '/landing-page',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=120' }],
      },
      {
        source: '/about-page',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/login',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/register',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' }],
      },
      {
        source: '/course-marketplace',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=60' }],
      },
    ];
  },

};

export default withBundleAnalyzer(nextConfig);
