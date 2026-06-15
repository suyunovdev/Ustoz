import type { Metadata } from 'next';
import Link from 'next/link';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import RegistrationForm from './components/RegistrationForm';

export const metadata: Metadata = {
  title: 'Ro\'yxatdan o\'tish',
  description: 'Ustoz platformasida yangi akkaunt yarating. O\'qituvchi yoki talaba sifatida ro\'yxatdan o\'ting va ta\'lim jarayoniga qo\'shiling.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader userRole={null} currentPath="/register" />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-3">
              Ro'yxatdan o'tish
            </h1>
            <p className="text-lg text-muted-foreground">
              Ustoz platformasiga xush kelibsiz. Akkaunt yarating va o'qitish yoki o'rganishni boshlang.
            </p>
          </div>

          {/* Registration Form */}
          <RegistrationForm />

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Allaqachon akkauntingiz bormi?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline transition-smooth"
              >
                Kirish
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
                Yordam markazi
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-primary transition-smooth">
                Foydalanish shartlari
              </Link>
              <span>•</span>
              <Link href="#" className="hover:text-primary transition-smooth">
                Maxfiylik siyosati
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Ustoz. Barcha huquqlar himoyalangan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}