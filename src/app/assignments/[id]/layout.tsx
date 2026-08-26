import PublicShell from '@/components/common/PublicShell';

// Rol-aware shell — authenticated → sidebar (butun platforma bilan izchil),
// mehmon → header. (Ilgari top-header/shell'siz edi — nomuvofiq.)
export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicShell>{children}</PublicShell>;
}
