const LoadingSkeleton = () => {
  return (
    <>
      {[1, 2, 3, 4, 5, 6]?.map((i) => (
        <div key={i} className="bg-card rounded-md shadow-warm overflow-hidden animate-pulse">
          <div className="h-48 bg-muted"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-6 bg-muted rounded w-full"></div>
            <div className="h-6 bg-muted rounded w-4/5"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-1/4"></div>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-10 bg-muted rounded w-1/3"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default LoadingSkeleton;