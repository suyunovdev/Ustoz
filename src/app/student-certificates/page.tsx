import type { Metadata } from 'next';
import CertificatesPageClient from './CertificatesPageClient';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.certificatesTitle'),
    description: t('meta.certificatesDesc'),
  };
}

export default function CertificatesPage() {
  return <CertificatesPageClient />;
}
