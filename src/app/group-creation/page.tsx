import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import GroupCreationInteractive from './components/GroupCreationInteractive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.groupCreateTitle'),
    description: t('meta.groupCreateDesc'),
  };
}

export default function GroupCreationPage() {
  return <GroupCreationInteractive />;
}