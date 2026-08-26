import PublicShell from '@/components/common/PublicShell';

// Rol-aware shell (sidebar authenticated'da) — payment flow izchilligi.
// (Metadata page.tsx'ning generateMetadata'sida.)
export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
