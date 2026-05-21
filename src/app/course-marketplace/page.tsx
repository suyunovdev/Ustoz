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
  title: 'Course Marketplace - Ustoz',
  description: 'Discover and purchase educational courses across multiple categories including programming, languages, business, design, and marketing. Filter by price, language, difficulty level, and ratings to find the perfect course for your learning journey.',
};

export default function CourseMarketplacePage() {
  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/course-marketplace" />
      <MarketplaceInteractive />
    </>
  );
}