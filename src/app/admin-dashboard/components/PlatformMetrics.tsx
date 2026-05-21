import Icon from '@/components/ui/AppIcon';

interface PlatformMetricsProps {
  stats: {
    totalUsers: number;
    activeCourses: number;
    totalRevenue: number;
    systemHealth: number;
    userGrowth: number;
    courseGrowth: number;
    revenueGrowth: number;
  };
  isLoading: boolean;
}

const PlatformMetrics = ({ stats, isLoading }: PlatformMetricsProps) => {
  const metrics = [
    {
      title: 'Jami foydalanuvchilar',
      value: stats.totalUsers.toLocaleString(),
      icon: 'UserGroupIcon',
      trend: { value: stats.userGrowth, isPositive: stats.userGrowth > 0 },
      color: 'text-primary'
    },
    {
      title: 'Faol kurslar',
      value: stats.activeCourses.toLocaleString(),
      icon: 'BookOpenIcon',
      trend: { value: stats.courseGrowth, isPositive: stats.courseGrowth > 0 },
      color: 'text-success'
    },
    {
      title: 'Umumiy daromad',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: 'CurrencyDollarIcon',
      trend: { value: stats.revenueGrowth, isPositive: stats.revenueGrowth > 0 },
      color: 'text-secondary'
    },
    {
      title: 'Tizim holati',
      value: `${stats.systemHealth}%`,
      icon: 'ServerIcon',
      trend: { value: 0, isPositive: true },
      color: stats.systemHealth >= 95 ? 'text-success' : 'text-warning'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-md shadow-warm p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <div key={metric.title} className="bg-card rounded-md shadow-warm p-6 transition-smooth hover:shadow-warm-md">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground caption mb-1">{metric.title}</p>
              <h3 className="text-3xl font-heading font-bold text-foreground">{metric.value}</h3>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md">
              <Icon name={metric.icon as any} size={24} className={metric.color} />
            </div>
          </div>
          {metric.trend.value !== 0 && (
            <div className="flex items-center space-x-2">
              <Icon 
                name={metric.trend.isPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} 
                size={16} 
                className={metric.trend.isPositive ? 'text-success' : 'text-destructive'} 
              />
              <span className={`text-sm font-medium ${metric.trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {metric.trend.value}%
              </span>
              <span className="text-sm text-muted-foreground">vs o'tgan oy</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PlatformMetrics;