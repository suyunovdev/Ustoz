import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import CertificatesClient from './CertificatesClient';

export const dynamic = 'force-dynamic';

export default function TeacherCertificatesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CertificatesClient />
    </Suspense>
  );
}
