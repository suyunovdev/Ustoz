import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { getServerT } from '@/lib/i18n/server';

// Dynamic import to fix chunk loading issues
const MarketplaceInteractive = dynamic(
  () => import('./components/MarketplaceInteractive'),
  { 
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.marketplaceTitle'),
    description: t('meta.marketplaceDesc'),
    alternates: { canonical: '/course-marketplace' },
    openGraph: {
      title: t('meta.marketplaceOgTitle'),
      description: t('meta.marketplaceOgDesc'),
      url: '/course-marketplace',
      type: 'website',
    },
  };
}

export default function CourseMarketplacePage() {
  return <MarketplaceInteractive />;
}