import type { Metadata } from 'next';
import LegalPage, { type LegalSection } from '@/components/legal/LegalPage';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.termsTitle'),
    description: t('auth.termsModalIntro'),
  };
}

export default async function TermsPage() {
  const t = await getServerT();
  const sections: LegalSection[] = [
    { heading: t('auth.termsAccount'), body: t('auth.termsAccountDesc') },
    { heading: t('auth.termsContent'), body: t('auth.termsContentDesc') },
    { heading: t('auth.termsPayment'), body: t('auth.termsPaymentDesc') },
    { heading: t('auth.termsRefund'), body: t('auth.termsRefundDesc') },
  ];
  return (
    <LegalPage
      icon="DocumentTextIcon"
      title={t('auth.termsModalTitle')}
      intro={t('auth.termsModalIntro')}
      sections={sections}
      updatedLabel={t('legal.lastUpdated')}
    />
  );
}
