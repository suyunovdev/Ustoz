import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import RoleBasedShell from '@/components/common/RoleBasedShell';

// Butun platformada bo'lgani kabi — rol-aware sidebar (student uchun StudentSidebar).
// Dars pleyeri endi izchil sidebar layout ichida ishlaydi (top-header EMAS).
export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/learning-interface');
  return (
    <RoleBasedShell initialRole={(session?.role ?? null) as 'student' | 'teacher' | 'admin' | null}>
      {children}
    </RoleBasedShell>
  );
}
