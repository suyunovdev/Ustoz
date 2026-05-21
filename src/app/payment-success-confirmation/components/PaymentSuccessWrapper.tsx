'use client';

import dynamic from 'next/dynamic';

const PaymentSuccessInteractive = dynamic(
  () => import('./PaymentSuccessInteractive'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
      </div>
    )
  }
);

export default function PaymentSuccessWrapper() {
  return <PaymentSuccessInteractive />;
}