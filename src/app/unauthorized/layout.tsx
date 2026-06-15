import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ruxsat yo\'q',
  description: 'Bu sahifaga kirish uchun ruxsatingiz yo\'q. Iltimos, tizimga kiring yoki administrator bilan bog\'laning.',
};

export default function UnauthorizedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
