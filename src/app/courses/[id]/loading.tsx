import LoadingFallback from '@/components/common/LoadingFallback';

export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto w-full p-4 md:p-6">
      <LoadingFallback variant="detail" />
    </div>
  );
}
