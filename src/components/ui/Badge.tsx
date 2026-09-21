/**
 * Badge / StatusPill — status va yorliqlar uchun yagona chip.
 * variant → mos rang jufti (brend tokenlari, light/dark mos).
 * Sariq (warning) brend qoidasi: oq matn EMAS — Tun-ko'ki foreground.
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'muted';

const VARIANTS: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/10 text-secondary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/15 text-warning-foreground dark:text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  muted: 'bg-muted text-muted-foreground',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'muted', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        VARIANTS[variant],
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export default Badge;
