import LoadingFallback from '@/components/common/LoadingFallback';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <LoadingFallback variant="page" />
    </div>
  );
}
