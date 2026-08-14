import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
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
  if (!session) redirect('/login');
  return (
    <RoleBasedShell initialRole={(session?.role ?? null) as 'student' | 'teacher' | 'admin' | null}>
      {children}
    </RoleBasedShell>
  );
}
