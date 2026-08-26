import type { Metadata } from 'next';
import { Suspense } from 'react';
import QuizInterfaceInteractive from './components/QuizInterfaceInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.quizTitle'),
    description: t('meta.quizDesc'),
  };
}

export default function QuizInterfacePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <QuizInterfaceInteractive />
    </Suspense>
  );
}