import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { AuthProvider } from '@/contexts/AuthContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Ustoz Ta'lim - O'quv platformasi",
  description: "O'zbek o'quvchilar va o'qituvchilar uchun zamonaviy onlayn ta'lim platformasi",
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
</body>
    </html>
  );
}
