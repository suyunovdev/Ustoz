import LoadingFallback from '@/components/common/LoadingFallback';

export default function Loading() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto w-full">
      <LoadingFallback variant="dashboard" />
    </div>
  );
}
