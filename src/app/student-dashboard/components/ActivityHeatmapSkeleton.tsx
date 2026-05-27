const ActivityHeatmapSkeleton = ({ weeks = 13 }: { weeks?: number }) => {
  return (
    <div className="bg-card rounded-md shadow-warm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex gap-1 animate-pulse">
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="flex flex-col gap-[2px]">
            {Array.from({ length: 7 }).map((_, d) => (
              <div key={d} className="w-3 h-3 bg-muted rounded-sm" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityHeatmapSkeleton;
