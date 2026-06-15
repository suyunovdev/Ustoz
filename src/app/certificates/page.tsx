import type { Metadata } from 'next';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import CertificatesPageClient from './CertificatesPageClient';

export const metadata: Metadata = {
  title: 'Sertifikatlar',
  description: "Tugatgan kurslaringiz uchun olgan sertifikatlaringizni ko'ring va yuklab oling.",
};

export default function CertificatesPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/certificates" />
      <CertificatesPageClient />
    </>
  );
}
