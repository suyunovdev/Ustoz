'use client';

import { Suspense } from 'react';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import PaymentProcessingInteractive from './components/PaymentProcessingInteractive';

export default function PaymentProcessingPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/payment-processing" />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <PaymentProcessingInteractive />
      </Suspense>
    </>
  );
}