import type { Metadata } from 'next';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import dynamic from 'next/dynamic';

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

export const metadata: Metadata = {
  title: 'Kurslar marketplace',
  description:
    "O'zbek tilidagi kurslarni kashf eting: maktab fanlari, tillar, san'at, hunarmandchilik, sport, tibbiyot, biznes va boshqa o'nlab yo'nalishlar. Narx, daraja va reyting bo'yicha filtr qiling, sizga mos kursni toping.",
  alternates: { canonical: '/course-marketplace' },
  openGraph: {
    title: 'Kurslar marketplace | Ustoz',
    description: "O'zbek tilidagi onlayn kurslar katalogi.",
    url: '/course-marketplace',
    type: 'website',
  },
};

export default function CourseMarketplacePage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/course-marketplace" />
      <MarketplaceInteractive />
    </>
  );
}