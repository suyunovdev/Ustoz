import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import SequentialTestBuilderInteractive from './components/SequentialTestBuilderInteractive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.testBuilderTitle'),
    description: t('meta.testBuilderDesc'),
  };
}

export default function SequentialTestBuilderPage() {
  return <SequentialTestBuilderInteractive />;
}