import type { Metadata } from 'next';
import LandingPageInteractive from './components/LandingPageInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.landingTitle'),
    description: t('meta.landingDesc'),
  };
}

// 60 sekund cache — har 60 sekundda yangilanadi
export const revalidate = 60;

export default function LandingPage() {
  return <LandingPageInteractive />;
}
