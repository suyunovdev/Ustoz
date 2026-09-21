'use client';

/**
 * Drawer — o'ngdan chiquvchi yon panel (detail ko'rinishi + action formalar uchun).
 * Modal andozasida: role=dialog, aria-modal, Esc, focus-trap, scroll-lock.
 * Sticky header + skroll body + ixtiyoriy sticky footer (amal tugmalari).
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

type Width = 'md' | 'lg';
const WIDTHS: Record<Width, string> = {
  md: 'max-w-md',
  lg: 'max-w-xl',
};

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: Width;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}: DrawerProps) {
  const { t } = useI18n();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const prevFocus = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    const el = panelRef.current;
    const focusable = el?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? el)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((n) => !n.hasAttribute('disabled') && n.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`absolute top-0 right-0 h-full w-full ${WIDTHS[width]} bg-card shadow-warm-lg flex flex-col focus:outline-none animate-in slide-in-from-right duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            {title && (
              <h2 id={titleId} className="text-lg font-heading font-semibold text-foreground truncate">
                {title}
              </h2>
            )}
            {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 -mr-1.5 rounded-md hover:bg-muted transition-smooth text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-border flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Drawer;
