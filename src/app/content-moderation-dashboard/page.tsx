import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import ModerationDashboardInteractive from './components/ModerationDashboardInteractive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.moderationTitle'),
    description: t('meta.moderationDesc'),
  };
}

export default function ContentModerationDashboardPage() {
  return <ModerationDashboardInteractive />;
}