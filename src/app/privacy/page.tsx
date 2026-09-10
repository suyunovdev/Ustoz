import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { getServerLocale, getServerT } from '@/lib/i18n/server';
import { getPrivacyContent } from '@/lib/legal/legalContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  const locale = await getServerLocale();
  const doc = getPrivacyContent(locale);
  return {
    title: t('meta.privacyTitle'),
    description: doc.intro,
    alternates: { canonical: '/privacy' },
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const doc = getPrivacyContent(locale);
  return (
    <LegalPage
      icon="ShieldCheckIcon"
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      updatedLabel={doc.effectiveDate}
    />
  );
}
