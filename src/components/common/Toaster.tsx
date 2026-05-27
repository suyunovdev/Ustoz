'use client';

/**
 * Minimal toast tizimi — npm dependency yo'q.
 *
 * Foydalanish:
 *   import { toast, Toaster } from '@/components/common/Toaster';
 *   toast.success('Saqlandi');
 *   toast.error('Xato yuz berdi');
 *
 * Layout darajasida bir marta render qiling:
 *   <Toaster />
 */

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  durationMs: number;
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();
let counter = 0;

function emit() {
  for (const l of listeners) l(toasts);
}

function show(message: string, variant: ToastVariant, durationMs = 3500) {
  const id = ++counter;
  toasts = [...toasts, { id, message, variant, durationMs }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, durationMs);
}

export const toast = {
  success: (msg: string, ms?: number) => show(msg, 'success', ms),
  error: (msg: string, ms?: number) => show(msg, 'error', ms),
  info: (msg: string, ms?: number) => show(msg, 'info', ms),
};

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: string }> = {
  success: { bg: 'bg-success text-success-foreground', icon: 'CheckCircleIcon' },
  error: { bg: 'bg-destructive text-destructive-foreground', icon: 'XCircleIcon' },
  info: { bg: 'bg-primary text-primary-foreground', icon: 'InformationCircleIcon' },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-300 flex flex-col-reverse gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      {items.map((t) => {
        const v = VARIANT_STYLES[t.variant];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-md shadow-warm-lg ${v.bg} animate-in slide-in-from-bottom-4`}
            role="status"
          >
            <Icon name={v.icon} size={20} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-snug">{t.message}</p>
          </div>
        );
      })}
    </div>
  );
}
