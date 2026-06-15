import type { Metadata } from 'next';
import { Suspense } from 'react';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import PaymentSuccessWrapper from './components/PaymentSuccessWrapper';

export const metadata: Metadata = {
  title: 'To\'lov muvaffaqiyatli',
  description: 'To\'lov muvaffaqiyatli amalga oshirildi. Kursga kirish va chek yuklab olish.',
};

export default function PaymentSuccessConfirmationPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/payment-success-confirmation" />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <PaymentSuccessWrapper />
      </Suspense>
    </>
  );
}