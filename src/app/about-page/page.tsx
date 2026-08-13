import type { Metadata } from 'next';
import AboutPageInteractive from './components/AboutPageInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.aboutTitle'),
    description: t('meta.aboutDesc'),
  };
}

export default function AboutPage() {
  return <AboutPageInteractive />;
}