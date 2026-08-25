import type { Metadata } from 'next';
import Link from 'next/link';
import RegistrationForm from './components/RegistrationForm';
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
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Sarlavha RegistrationForm ichida (dublikat h1 olib tashlandi — a11y) */}
          {/* Registration Form */}
          <RegistrationForm />

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline transition-smooth"
              >
                {t('auth.login')}
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-smooth">
                {t('auth.helpCenter')}
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-primary transition-smooth">
                {t('auth.termsModalTitle')}
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-primary transition-smooth">
                {t('auth.privacyModalTitle')}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {t('auth.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}