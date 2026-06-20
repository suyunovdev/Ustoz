import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const MetricsCard = ({ title, value, icon, trend, subtitle }: MetricsCardProps) => {
  const { t } = useI18n();
  return (
    <div className="bg-card rounded-md shadow-warm p-6 transition-smooth hover:shadow-warm-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground caption mb-1">{title}</p>
          <h3 className="text-3xl font-heading font-bold text-foreground">{value}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md">
          <Icon name={icon as any} size={24} className="text-primary" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center space-x-2">
          <Icon 
            name={trend.isPositive ? 'ArrowTrendingUpIcon' : 'ArrowTrendingDownIcon'} 
            size={16} 
            className={trend.isPositive ? 'text-success' : 'text-destructive'} 
          />
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.value}%
          </span>
          <span className="text-sm text-muted-foreground">{t('teacher.vsLastMonth')}</span>
        </div>
      )}
    </div>
  );
};

export default MetricsCard;