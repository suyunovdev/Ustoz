import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import RoleBasedShell from '@/components/common/RoleBasedShell';

export const metadata: Metadata = {
  title: 'Topshiriqlar portali',
  description: 'Topshiriqlarni yuklang, muddatlarni kuzating va natijalarni ko\'ring. Talabalar uchun topshiriq portali.',
};

export default async function AssignmentSubmissionPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <RoleBasedShell initialRole={(session?.role ?? null) as 'student' | 'teacher' | 'admin' | null}>
      {children}
    </RoleBasedShell>
  );
}
