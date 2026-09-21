/**
 * StatCard — KPI/statistika kartasi (ikonka + katta raqam + ixtiyoriy trend).
 * PlatformMetrics naqshidan ajratilgan, CRM bo'lim tepasidagi stats uchun.
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: string;
  iconColor?: string;
  /** Foizli o'zgarish — musbat yashil, manfiy qizil. */
  trend?: number;
  sub?: string;
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = 'text-primary',
  trend,
  sub,
}: StatCardProps) {
  const positive = (trend ?? 0) > 0;
  return (
    <div className="bg-card rounded-lg border border-border p-4 transition-smooth hover:shadow-warm">
      <div className="flex items-start justify-between mb-2 gap-2">
        <p className="text-sm text-muted-foreground min-w-0 truncate">{label}</p>
        {icon && (
          <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-md shrink-0">
            <Icon name={icon} size={18} className={iconColor} />
          </div>
        )}
      </div>
      <div className="text-2xl font-heading font-bold text-foreground truncate">{value}</div>
      {(sub || (trend != null && trend !== 0)) && (
        <div className="flex items-center gap-2 mt-1">
          {trend != null && trend !== 0 && (
            <span
              className={cx(
                'inline-flex items-center gap-0.5 text-xs font-medium shrink-0',
                positive ? 'text-success' : 'text-destructive',
              )}
            >
              <Icon
                name={positive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'}
                size={12}
              />
              {Math.abs(trend)}%
            </span>
          )}
          {sub && <span className="text-xs text-muted-foreground truncate">{sub}</span>}
        </div>
      )}
    </div>
  );
}

export function StatCardGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('grid grid-cols-2 lg:grid-cols-4 gap-3', className)}>{children}</div>
  );
}

export default StatCard;
