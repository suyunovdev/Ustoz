import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { Suspense } from 'react';
import PaymentSuccessWrapper from './components/PaymentSuccessWrapper';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.paymentSuccessTitle'),
    description: t('meta.paymentSuccessDesc'),
  };
}

export default function PaymentSuccessConfirmationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <PaymentSuccessWrapper />
    </Suspense>
  );
}