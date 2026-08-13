import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import ContentUploadInteractive from './components/ContentUploadInteractive';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.uploadTitle'),
    description: t('meta.uploadDesc'),
  };
}

export default function ContentUploadCenterPage() {
  return <ContentUploadInteractive />;
}