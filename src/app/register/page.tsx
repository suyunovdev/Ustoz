import type { Metadata } from 'next';
import Link from 'next/link';
import RegistrationForm from './components/RegistrationForm';
import AuthBrandPanel, { AuthMobileBrand } from './components/AuthBrandPanel';
import ThemeToggle from '@/components/common/ThemeToggle';
import { AUTH_FORM_REMAP, AUTH_PAPER } from './components/authTheme';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.registerTitle'),
    description: t('meta.registerDesc'),
  };
}

export default async function RegisterPage() {
  const t = await getServerT();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Brend paneli (faqat lg+) */}
      <AuthBrandPanel
        title={t('landing.heroTitle')}
        subtitle={t('landing.missionDesc')}
        trust={[t('landing.trustQualityGuarantee'), t('landing.trustSecurePayment'), t('landing.trustDataProtection')]}
      />

      {/* Forma ustuni — token'lar yangi palitraga qayta belgilangan */}
      <main
        className="flex flex-col min-h-screen"
        style={{ ...AUTH_FORM_REMAP, background: AUTH_PAPER }}
      >
        <div className="flex justify-end px-4 sm:px-6 pt-4">
          <ThemeToggle />
        </div>
        <AuthMobileBrand />
        <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-10">
          <div className="w-full max-w-2xl">
            <RegistrationForm />

            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline transition-smooth">
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <footer className="px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-3">
            <Link href="/help" className="hover:text-primary transition-smooth">{t('auth.helpCenter')}</Link>
            <span className="opacity-40">·</span>
            <Link href="/help" className="hover:text-primary transition-smooth">{t('auth.termsModalTitle')}</Link>
            <span className="opacity-40">·</span>
            <Link href="/help" className="hover:text-primary transition-smooth">{t('auth.privacyModalTitle')}</Link>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {t('auth.copyright')}
          </p>
        </footer>
      </main>
    </div>
  );
}
