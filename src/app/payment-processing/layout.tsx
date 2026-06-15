import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'To\'lov jarayoni',
  description: 'To\'lov amalga oshirilmoqda. Iltimos, sahifani yopmang va jarayon tugashini kuting.',
};

export default function PaymentProcessingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
