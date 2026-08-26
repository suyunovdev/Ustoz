import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'To\'lov usuli',
  description: 'Kurs uchun to\'lov usulini tanlang. Payme, Click va boshqa to\'lov tizimlari orqali xavfsiz to\'lov.',
};

import PublicShell from '@/components/common/PublicShell';

// Rol-aware shell — authenticated student → sidebar (course-details bilan izchil),
// mehmon → header. Ilgari sahifa RoleBasedHeader'ni qattiq kodlab, doim
// top-header ko'rsatardi (sidebar migratsiyasida o'tkazib yuborilgan edi).
export default function PaymentMethodSelectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
