'use client';

import { useEffect, useRef, useId } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useI18n();
  const resolvedConfirmLabel = confirmLabel ?? t('ui.confirm');
  const resolvedCancelLabel = cancelLabel ?? t('ui.cancel');
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const msgId = useId();

  // Esc bilan yopish + focus-trap + focus-restore
  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement as HTMLElement;
    const el = panelRef.current;
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((n) => n.offsetParent !== null);
    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) { onCancel(); return; }
      if (e.key === 'Tab' && el) {
        const items = focusables();
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prevFocus.current?.focus?.();
    };
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-destructive text-destructive-foreground hover:opacity-90'
      : 'bg-primary text-primary-foreground hover:opacity-90';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby={msgId}
      onClick={() => !isLoading && onCancel()}
    >
      <div
        ref={panelRef}
        className="bg-card rounded-md shadow-warm-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          {variant === 'danger' && (
            <div className="flex items-center justify-center w-10 h-10 bg-destructive/10 rounded-full shrink-0">
              <Icon name="ExclamationTriangleIcon" size={24} className="text-destructive" />
            </div>
          )}
          <div className="flex-1">
            <h3
              id="confirm-modal-title"
              className="text-lg font-heading font-semibold text-foreground mb-2"
            >
              {title}
            </h3>
            <p id={msgId} className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-smooth font-medium disabled:opacity-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md transition-smooth font-medium disabled:opacity-50 flex items-center gap-2 ${confirmBtnClass}`}
          >
            {isLoading && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
