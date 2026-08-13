import type { Metadata } from 'next';
import TransactionHistoryInteractive from './components/TransactionHistoryInteractive';

export const metadata: Metadata = {
  title: "To'lov tarixi",
  description: "To'lovlar tarixi va kurs sotib olishlar haqida to'liq ma'lumot",
};

export default function TransactionHistoryPage() {
  return <TransactionHistoryInteractive />;
}