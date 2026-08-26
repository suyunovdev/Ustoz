import type { Metadata } from 'next';
import { Suspense } from 'react';
import PracticeExamInteractive from './components/PracticeExamInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: `${t('exam.title')} | Ustoz`,
    description: t('exam.subtitle'),
    robots: { index: false, follow: false },
  };
}

export default function PracticeExamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PracticeExamInteractive />
    </Suspense>
  );
}
