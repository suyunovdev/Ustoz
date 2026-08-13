import type { Metadata } from 'next';
import { Suspense } from 'react';
import ForgotPasswordInteractive from './components/ForgotPasswordInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.forgotPasswordTitle'),
    description: t('meta.forgotPasswordDesc'),
  };
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }>
        <ForgotPasswordInteractive />
      </Suspense>
    </div>
  );
}
