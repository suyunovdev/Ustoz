/**
 * LoadingFallback — Suspense/route fallback uchun umumiy professional skeleton.
 *
 * Ilgari oddiy "Yuklanmoqda" matni edi; endi brend-rangli shimmer skeleton.
 * `variant` orqali kontekstga mos skeleton tanlanadi (default: sahifa/dashboard).
 */
import {
  SkeletonPage,
  SkeletonCardGrid,
  SkeletonList,
  SkeletonTable,
  SkeletonDetail,
  SkeletonForm,
  SkeletonDashboard,
} from '@/components/ui/Skeleton';

type Variant = 'page' | 'grid' | 'list' | 'table' | 'detail' | 'form' | 'dashboard';

export default function LoadingFallback({
  variant = 'page',
  className,
}: {
  variant?: Variant;
  /** Eski chaqiruvlar bilan moslik uchun — tashqi o'ram klassi. */
  className?: string;
}) {
  const body = (() => {
    switch (variant) {
      case 'grid':
        return <SkeletonCardGrid />;
      case 'list':
        return <SkeletonList />;
      case 'table':
        return <SkeletonTable />;
      case 'detail':
        return <SkeletonDetail />;
      case 'form':
        return <SkeletonForm />;
      case 'dashboard':
        return <SkeletonDashboard />;
      default:
        return <SkeletonPage />;
    }
  })();

  if (className) return <div className={className}>{body}</div>;
  return body;
}
