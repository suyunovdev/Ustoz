import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'To\'lov usuli',
  description: 'Kurs uchun to\'lov usulini tanlang. Payme, Click va boshqa to\'lov tizimlari orqali xavfsiz to\'lov.',
};

export default function PaymentMethodSelectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
