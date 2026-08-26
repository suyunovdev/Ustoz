import type { Metadata } from 'next';
import { Suspense } from 'react';
import LiveSessionsInteractive from './components/LiveSessionsInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: `${t('live.title')} | Ustoz`,
    description: t('live.subtitle'),
    robots: { index: false, follow: false },
  };
}

export default function LiveSessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <LiveSessionsInteractive />
    </Suspense>
  );
}
