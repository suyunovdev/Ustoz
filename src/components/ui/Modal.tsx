'use client';

/**
 * Modal — accessible dialog: role=dialog, aria-modal, aria-labelledby,
 * Esc bilan yopish, focus-trap + focus-restore, body scroll-lock, overflow-y-auto.
 * Barcha overlay/modallar shu orqali o'tishi kerak (a11y + izchillik).
 */
import * as React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const SIZES: Record<Size, string> = {
  sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl',
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: Size;
  /** Overlay bosilганда yopilsinmi (default: ha) */
  closeOnBackdrop?: boolean;
}

export function Modal({ open, onClose, title, children, footer, size = 'md', closeOnBackdrop = true }: ModalProps) {
  const { t } = useI18n();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const prevFocus = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    // Fokusni modalga ko'chirish
    const el = panelRef.current;
    const focusable = el?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? el)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
        ).filter((n) => !n.hasAttribute('disabled') && n.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${SIZES[size]} max-h-[90vh] overflow-y-auto bg-card rounded-md shadow-warm-lg focus:outline-none`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          {title ? (
            <h2 id={titleId} className="text-lg font-heading font-semibold text-foreground">{title}</h2>
          ) : <span />}
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-1.5 -mr-1.5 rounded-md hover:bg-muted transition-smooth text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
