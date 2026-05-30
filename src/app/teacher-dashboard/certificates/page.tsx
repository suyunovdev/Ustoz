import { Suspense } from 'react';
import CertificatesClient from './CertificatesClient';

export const dynamic = 'force-dynamic';

export default function TeacherCertificatesPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <CertificatesClient />
    </Suspense>
  );
}
