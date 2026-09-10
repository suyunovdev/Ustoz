import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { getServerLocale, getServerT } from '@/lib/i18n/server';
import { getTermsContent } from '@/lib/legal/legalContent';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  const locale = await getServerLocale();
  const doc = getTermsContent(locale);
  return {
    title: t('meta.termsTitle'),
    description: doc.intro,
    alternates: { canonical: '/terms' },
  };
}

export default async function TermsPage() {
  const locale = await getServerLocale();
  const doc = getTermsContent(locale);
  return (
    <LegalPage
      icon="DocumentTextIcon"
      title={doc.title}
      intro={doc.intro}
      sections={doc.sections}
      updatedLabel={doc.effectiveDate}
    />
  );
}
