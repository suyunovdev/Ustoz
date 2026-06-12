import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { Toaster } from '@/components/common/Toaster';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
  openGraph: {
    type: 'website',
    locale: 'uz_UZ',
    siteName: 'Ustoz',
    url: SITE_URL,
    title: "Ustoz Ta'lim — O'zbek tilidagi onlayn o'quv platformasi",
    description:
      "Kurslarni o'rganing, sertifikat oling va kasbiy rivojlaning.",
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ustoz Ta'lim",
    description: "O'zbek tilidagi onlayn o'quv platformasi",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script to apply theme before paint (prevents flash of wrong theme)
  const themeScript = `
    (function() {
      try {
        var t = localStorage.getItem('ustoz_theme') || 'light';
        var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
      } catch (e) {}
    })();
  `;

  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <I18nProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
