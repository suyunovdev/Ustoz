'use client';

import Icon from '@/components/ui/AppIcon';
import { useAdminStats } from '@/hooks/queries/useAdminStats';
import { useI18n } from '@/contexts/I18nContext';

function formatUzs(uzs: string | number): string {
  const n = typeof uzs === 'string' ? Number(uzs) : uzs;
  if (!Number.isFinite(n)) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`;
  return `${n.toLocaleString('uz-UZ')} so'm`;
}

const PlatformMetrics = () => {
  const { data, isLoading, error } = useAdminStats();
  const { t } = useI18n();

  if (isLoading || !data) {
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

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive">
        {t('admin.statsLoadError')}: {error.message}
      </div>
    );
  }

  const metrics = [
    {
      title: t('admin.totalUsers'),
      value: data.totalUsers.toLocaleString(),
      sub: `${data.usersByRole.student} ${t('admin.studentLabel')} · ${data.usersByRole.teacher} ${t('admin.teacherLabel')} · ${data.usersByRole.admin} ${t('admin.adminLabel')}`,
      icon: 'UserGroupIcon',
      trend: data.userGrowth,
      color: 'text-primary',
    },
    {
      title: t('admin.activeCourses'),
      value: data.activeCourses.toLocaleString(),
      sub: `+${data.newCoursesLast30d} ${t('admin.newCoursesLast30d')}`,
      icon: 'BookOpenIcon',
      trend: data.courseGrowth,
      color: 'text-success',
    },
    {
      title: t('admin.totalRevenue'),
      value: formatUzs(data.totalRevenueUzs),
      sub: `≈ $${data.totalRevenueUsd.toLocaleString()}`,
      icon: 'CurrencyDollarIcon',
      trend: data.revenueGrowth,
      color: 'text-secondary',
    },
    {
      title: t('admin.newUsers'),
      value: `+${data.newUsersLast30d}`,
      sub: t('admin.last30Days'),
      icon: 'SparklesIcon',
      trend: data.userGrowth,
      color: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const trendPositive = metric.trend > 0;
        const trendNegative = metric.trend < 0;
        return (
          <div
            key={metric.title}
            className="bg-card rounded-md shadow-warm p-6 transition-smooth hover:shadow-warm-md"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                <h3 className="text-2xl md:text-3xl font-heading font-bold text-foreground truncate">
                  {metric.value}
                </h3>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md shrink-0 ml-2">
                <Icon name={metric.icon} size={24} className={metric.color} />
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">{metric.sub}</span>
              {metric.trend !== 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  <Icon
                    name={trendPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'}
                    size={14}
                    className={trendPositive ? 'text-success' : 'text-destructive'}
                  />
                  <span
                    className={`text-xs font-medium ${
                      trendPositive ? 'text-success' : trendNegative ? 'text-destructive' : ''
                    }`}
                  >
                    {Math.abs(metric.trend)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlatformMetrics;
