import type { Metadata } from 'next';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import TransactionHistoryInteractive from './components/TransactionHistoryInteractive';

export const metadata: Metadata = {
  title: "To'lov Tarixi - Ustoz",
  description: "To'lovlar tarixi va kurs sotib olishlar haqida to'liq ma'lumot",
};

export default function TransactionHistoryPage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/transaction-history" />
      <TransactionHistoryInteractive />
    </>
  );
}