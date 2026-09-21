'use client';

/**
 * Tabs — ichki sub-tab navigatsiyasi (segmented, underline uslubi).
 * Har tabda ixtiyoriy son (badge). CRM panellari ichida ishlatiladi.
 */
import * as React from 'react';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export interface TabItem<V extends string> {
  id: V;
  label: string;
  count?: number;
}

export function Tabs<V extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center gap-1 border-b border-border overflow-x-auto', className)}>
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onChange(it.id)}
            className={cx(
              'inline-flex items-center gap-1.5 px-4 h-10 text-sm font-medium border-b-2 -mb-px transition-smooth whitespace-nowrap',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {it.label}
            {it.count != null && it.count > 0 && (
              <span
                className={cx(
                  'text-xs rounded-full px-1.5 py-0.5 leading-none',
                  active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
