import type { Metadata } from 'next';
import PublicShell from '@/components/common/PublicShell';

export const metadata: Metadata = {
  title: 'To\'lov jarayoni',
  description: 'To\'lov amalga oshirilmoqda. Iltimos, sahifani yopmang va jarayon tugashini kuting.',
};

// Rol-aware shell (sidebar authenticated'da) — payment flow izchilligi.
export default function PaymentProcessingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
