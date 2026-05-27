/**
 * Student Dashboard — server component loading skeleton.
 * Next.js avtomatik ko'rsatadi prefetch davom etayotganda.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome banner */}
            <div className="h-32 bg-muted rounded-md" />
            {/* Hero card */}
            <div className="h-72 bg-muted rounded-2xl" />
            {/* Heatmap */}
            <div className="h-44 bg-muted rounded-md" />
            {/* Search */}
            <div className="h-12 bg-muted rounded-md" />
            {/* Tabs */}
            <div className="flex gap-2">
              <div className="h-10 w-36 bg-muted rounded-md" />
              <div className="h-10 w-36 bg-muted rounded-md" />
              <div className="h-10 w-36 bg-muted rounded-md" />
            </div>
            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-48 bg-muted rounded-md" />
              <div className="h-48 bg-muted rounded-md" />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="h-32 bg-muted rounded-md" />
            <div className="h-48 bg-muted rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
