import type { Metadata } from 'next';
import CertificatesPageClient from './CertificatesPageClient';

export const metadata: Metadata = {
  title: 'Sertifikatlar',
  description: "Tugatgan kurslaringiz uchun olgan sertifikatlaringizni ko'ring va yuklab oling.",
};

export default function CertificatesPage() {
  return <CertificatesPageClient />;
}
