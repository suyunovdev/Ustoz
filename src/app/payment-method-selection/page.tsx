'use client';

import { Suspense } from 'react';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import PaymentMethodSelectionInteractive from './components/PaymentMethodSelectionInteractive';

export default function PaymentMethodSelectionPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/payment-method-selection" />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <PaymentMethodSelectionInteractive />
      </Suspense>
    </>
  );
}