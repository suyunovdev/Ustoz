import type { Metadata } from 'next';
import TransactionHistoryInteractive from './components/TransactionHistoryInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.transactionsTitle'),
    description: t('meta.transactionsDesc'),
  };
}

export default function TransactionHistoryPage() {
  return <TransactionHistoryInteractive />;
}