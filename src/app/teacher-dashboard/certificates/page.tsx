import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import CertificatesClient from './CertificatesClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('meta.teacherCertificates'), robots: { index: false, follow: false } };
}

export default function TeacherCertificatesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CertificatesClient />
    </Suspense>
  );
}
