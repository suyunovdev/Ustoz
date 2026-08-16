import type { Metadata } from 'next';
import SubscriptionInteractive from './components/SubscriptionInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('subscription.title'),
    description: t('subscription.subtitle'),
  };
}

export default function SubscriptionPage() {
  return <SubscriptionInteractive />;
}
