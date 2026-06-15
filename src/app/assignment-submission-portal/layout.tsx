import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Topshiriqlar portali',
  description: 'Topshiriqlarni yuklang, muddatlarni kuzating va natijalarni ko\'ring. Talabalar uchun topshiriq portali.',
};

export default function AssignmentSubmissionPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
