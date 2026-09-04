import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import LoginInteractive from './components/LoginInteractive';
import AuthBrandPanel, { AuthMobileBrand } from '@/app/register/components/AuthBrandPanel';
import ThemeToggle from '@/components/common/ThemeToggle';
import { AUTH_FORM_REMAP, AUTH_PAPER } from '@/app/register/components/authTheme';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.loginTitle'),
    description: t('meta.loginDesc'),
  };
}

export default async function LoginPage() {
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
          <div className="w-full max-w-md">
            <Suspense fallback={<div className="flex items-center justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
              <LoginInteractive />
            </Suspense>
          </div>
        </div>

        <footer className="px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Ustoz. {t('landing.footerRights')}
          </p>
        </footer>
      </main>
    </div>
  );
}
