import type { Metadata } from 'next';
import { Suspense } from 'react';
import LearningInterfaceInteractive from './components/LearningInterfaceInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.learningTitle'),
    description: t('meta.learningDesc'),
  };
}

// Immersive to'liq-ekran dars pleyeri — o'z yagona slim kurs-bari bilan (orqaga,
// kurs nomi, progress, kurikulum toggle). Umumiy app header/sidebar YO'Q: dars
// diqqatni jamlagan holda, Udemy/Coursera uslubida ko'riladi.
export default function LearningInterfacePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <LearningInterfaceInteractive />
    </Suspense>
  );
}
