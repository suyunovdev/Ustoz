import type { Metadata } from 'next';
import Link from 'next/link';
import RegistrationForm from './components/RegistrationForm';
import { getServerT } from '@/lib/i18n/server';

export const metadata: Metadata = {
  title: 'Ro\'yxatdan o\'tish',
  description: 'Ustoz platformasida yangi akkaunt yarating. O\'qituvchi yoki talaba sifatida ro\'yxatdan o\'ting va ta\'lim jarayoniga qo\'shiling.',
};

export default async function RegisterPage() {
  const t = await getServerT();
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-3">
              {t('auth.register')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('auth.registerWelcome')}
            </p>
          </div>

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