import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import RoleBasedShell from '@/components/common/RoleBasedShell';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/practice-exam');
  return (
    <RoleBasedShell initialRole={(session?.role ?? null) as 'student' | 'teacher' | 'admin' | null}>
      {children}
    </RoleBasedShell>
  );
}
