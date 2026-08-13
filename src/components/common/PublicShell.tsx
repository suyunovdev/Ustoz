import { getSession } from '@/lib/auth';
import RoleBasedHeader from './RoleBasedHeader';
import RoleBasedShell from './RoleBasedShell';

/**
 * Public (mehmon ham ko'radigan) sahifalar uchun rol-aware layout:
 *  - kirgan foydalanuvchi → o'z sidebar'i (RoleBasedShell)
 *  - mehmon → yuqori header (RoleBasedHeader) + fixed-header offset
 */
export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (session) {
    return (
      <RoleBasedShell
        initialRole={(session.role ?? null) as 'student' | 'teacher' | 'admin' | null}
      >
        {children}
      </RoleBasedShell>
    );
  }

  return (
    <>
      <RoleBasedHeader />
      {/* fixed header'ni qoplash uchun ofset */}
      <div className="pt-16">{children}</div>
    </>
  );
}
