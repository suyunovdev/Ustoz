'use client';

/**
 * Menu — amallar dropdown menyusi (uch nuqta tugma + backdrop).
 * Jadval qatori ichida ishlatilganda row-click'ni to'xtatadi (stopPropagation).
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';

function cx(...p: Array<string | false | undefined>) {
  return p.filter(Boolean).join(' ');
}

export interface MenuItem {
  label: string;
  icon?: string;
  onClick?: () => void;
  variant?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}

export interface MenuSection {
  label?: string;
  items: MenuItem[];
}

export interface MenuProps {
  items?: MenuItem[];
  sections?: MenuSection[];
  triggerIcon?: string;
  triggerLabel?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

const itemVariant = (v?: string) =>
  v === 'danger'
    ? 'text-destructive hover:bg-destructive/10'
    : v === 'success'
      ? 'text-success hover:bg-success/10'
      : 'text-foreground hover:bg-muted';

export function Menu({
  items,
  sections,
  triggerIcon = 'EllipsisVerticalIcon',
  triggerLabel = 'Amallar',
  align = 'right',
  disabled,
}: MenuProps) {
  const [open, setOpen] = React.useState(false);
  const groups: MenuSection[] = sections ?? (items ? [{ items }] : []);

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        disabled={disabled}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-md hover:bg-muted transition-smooth disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Icon name={triggerIcon} size={18} className="text-muted-foreground" />
      </button>
      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={cx(
              'absolute mt-1 w-56 bg-card border border-border rounded-md shadow-warm-lg z-20 py-1',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {groups.map((g, gi) => (
              <React.Fragment key={gi}>
                {gi > 0 && <div className="border-t border-border my-1" />}
                {g.label && (
                  <p className="px-4 py-1 text-xs text-muted-foreground">{g.label}</p>
                )}
                {g.items.map((it, ii) => (
                  <button
                    key={ii}
                    type="button"
                    role="menuitem"
                    disabled={it.disabled}
                    onClick={() => {
                      setOpen(false);
                      it.onClick?.();
                    }}
                    className={cx(
                      'w-full text-left px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed',
                      itemVariant(it.variant),
                    )}
                  >
                    {it.icon && <Icon name={it.icon} size={16} />}
                    {it.label}
                  </button>
                ))}
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Menu;
