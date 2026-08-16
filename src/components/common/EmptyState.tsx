'use client';
/**
 * EmptyState — bo'sh ro'yxat/grid uchun standart, do'stona UI.
 */
import Icon from '@/components/ui/AppIcon';

export default function EmptyState({
  icon = 'InboxIcon',
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? 'flex flex-col items-center justify-center p-12 text-center'} aria-hidden={false}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon name={icon} size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-muted-foreground mb-5 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
