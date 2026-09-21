'use client';

/**
 * BulkActionBar — bir nechta qator tanlanganda jadval ustida paydo bo'ladigan
 * ommaviy amallar paneli. "N tanlandi" + amal tugmalari + bekor qilish.
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';

export interface BulkAction {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline';
  onClick: () => void;
}

export interface BulkActionBarProps {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
  /** "N tanlandi" matnini yasovchi (i18n). */
  label: (count: number) => string;
  isLoading?: boolean;
}

export function BulkActionBar({ count, actions, onClear, label, isLoading }: BulkActionBarProps) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-2.5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <button
          type="button"
          onClick={onClear}
          aria-label="Tanlovni bekor qilish"
          className="p-1 rounded-md hover:bg-primary/10 transition-smooth"
        >
          <Icon name="XMarkIcon" size={16} className="text-muted-foreground" />
        </button>
        {label(count)}
      </div>
      <div className="flex items-center gap-2">
        {actions.map((a, i) => (
          <Button
            key={i}
            variant={a.variant ?? 'outline'}
            size="sm"
            iconLeft={a.icon}
            loading={isLoading}
            onClick={a.onClick}
          >
            {a.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default BulkActionBar;
