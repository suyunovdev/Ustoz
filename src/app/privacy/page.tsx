import type { Metadata } from 'next';
import LegalPage, { type LegalSection } from '@/components/legal/LegalPage';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.privacyTitle'),
    description: t('auth.privacyModalIntro'),
  };
}

export default async function PrivacyPage() {
  const t = await getServerT();
  const sections: LegalSection[] = [
    { heading: t('auth.privacyCollection'), body: t('auth.privacyCollectionDesc') },
    { heading: t('auth.privacyUsage'), body: t('auth.privacyUsageDesc') },
    { heading: t('auth.privacySecurity'), body: t('auth.privacySecurityDesc') },
  ];
  return (
    <LegalPage
      icon="ShieldCheckIcon"
      title={t('auth.privacyModalTitle')}
      intro={t('auth.privacyModalIntro')}
      sections={sections}
      updatedLabel={t('legal.lastUpdated')}
    />
  );
}
