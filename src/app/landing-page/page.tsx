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

// generateMetadata `cookies()` (getServerT) o'qigani uchun sahifa dynamic
// bo'lishi shart — aks holda ISR cache tufayli meta doim default tilda (uz)
// qolib, RU/EN foydalanuvchilarga lokalizatsiya qilinmasdi.
export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return <LandingPageInteractive />;
}
