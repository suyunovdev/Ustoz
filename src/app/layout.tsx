import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Nunito_Sans, JetBrains_Mono, Sora } from 'next/font/google';
import '../styles/index.css';

// Brandbook shrift tizimi (self-hosted next/font, layout-shift yo'q):
//   Nunito Sans — matn (var(--font-sans)); Sora — sarlavha/tugma (var(--font-display));
//   JetBrains Mono — kod/raqam (var(--font-mono)). cyrillic subset: ru tili uchun.
const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
// Sora — brend display shrifti: barcha sarlavhalar (font-heading), hero va tugmalar.
// Geometrik, ochiq shakllar — zamonaviy va do'stona (brandbook 04).
const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/common/Toaster';
import CookieConsent from '@/components/common/CookieConsent';
import Analytics from '@/components/common/Analytics';
import ErrorReporter from '@/components/common/ErrorReporter';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import { getServerLocale } from '@/lib/i18n/server';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F2447' },
  ],
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'http://localhost:4028';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Ustoz Ta'lim — O'zbek tilidagi onlayn o'quv platformasi",
    template: '%s | Ustoz',
  },
  description:
    "O'zbek o'quvchilar va o'qituvchilar uchun zamonaviy onlayn ta'lim platformasi. Kurslar, sertifikatlar va shaxsiy tavsiyalar.",
  applicationName: 'Ustoz',
  keywords: [
    "ustoz",
    "onlayn ta'lim",
    "kurslar",
    "o'zbek tilida",
    "sertifikat",
    "video darslar",
  ],
  authors: [{ name: 'Ustoz Team' }],
  // Google Search Console domen egaligini tasdiqlash (SEO + OAuth verification uchun).
  verification: {
    google: '_kD9ZLgMyJSbyN4x6xsn8-9xvuNQ2Sd98_hQ5w3VzGY',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    alternateLocale: ['ru_RU', 'en_US'],
    siteName: 'UstozEdu',
    url: SITE_URL,
    title: "UstozEdu — O'zbek tilidagi onlayn o'quv platformasi",
    description:
      "Kurslarni o'rganing, sertifikat oling va kasbiy rivojlaning.",
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'UstozEdu — onlayn ta\'lim platformasi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "UstozEdu — O'zbek tilidagi onlayn o'quv platformasi",
    description: "O'zbek tilidagi onlayn o'quv platformasi",
    images: ['/og.png'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR'da `<html lang>` cookie tiliga mos bo'lishi uchun (SEO + a11y).
  // Client'da quyidagi inline script localStorage bo'yicha yana bir bor
  // moslashtiradi (cookie va localStorage saveLocale'da sinxron saqlanadi).
  const serverLocale = await getServerLocale();
  // Inline script to apply theme before paint (prevents flash of wrong theme)
  const themeScript = `
    (function() {
      try {
        var t = localStorage.getItem('ustoz_theme') || 'light';
        var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
        var lang = localStorage.getItem('ustoz_lang');
        if (lang === 'ru' || lang === 'en') document.documentElement.lang = lang;
      } catch (e) {}
    })();
  `;

  // SEO: strukturaviy ma'lumot (schema.org JSON-LD) — Organization + WebSite.
  // Google'ga brend, logo va sayt-ichi qidiruvni tushuntiradi (rich results / sitelinks).
  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'UstozEdu',
    alternateName: 'Ustoz',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    email: 'ilyossuyunov416@gmail.com',
    description:
      "O'zbek o'quvchilar va o'qituvchilar uchun zamonaviy onlayn ta'lim platformasi.",
  };
  const siteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'UstozEdu',
    url: SITE_URL,
    inLanguage: ['uz', 'ru', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/course-marketplace?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang={serverLocale} className={`${nunitoSans.variable} ${jetbrainsMono.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      </head>
      <body>
        <AuthProvider>
          <I18nProvider>
            <CookieConsentProvider>
              <QueryProvider>
                {children}
                <Toaster />
                <CookieConsent />
                <Analytics />
                <ErrorReporter />
              </QueryProvider>
            </CookieConsentProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
