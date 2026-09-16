'use client';

import { type ReactNode } from 'react';

interface FormFieldProps {
  /** Yorliq matni. */
  label: string;
  /** Bola input `id`si — yorliq shunga bog'lanadi va xato `aria-describedby` uchun ishlatiladi. */
  htmlFor?: string;
  /** Majburiy maydon — yorliqda `*` ko'rsatiladi. */
  required?: boolean;
  /** Inline xato matni (qizil). Berilса izoh o'rniga ko'rinadi. */
  error?: string | null;
  /** Ixtiyoriy izoh (kulrang) — xato bo'lmagan holatда. */
  hint?: string;
  /** Xato/izoh bloki ustidagi kontent (input/select/textarea yoki NumberInput). */
  children: ReactNode;
  /** Tashqi o'ram klasslari. */
  className?: string;
}

/**
 * Yagona forma-maydon o'rami — yorliq (+ majburiy `*`), inline xato (qizil matn)
 * va ixtiyoriy izohни izchil ko'rsatadi. Toast (submit-darajali) o'rnini bosmaydi,
 * unga maydon-darajali signal qo'shadi.
 *
 * Input ramkasini xato holatида almashtirish uchun `fieldClasses(error)`
 * helper'idан foydalaning — u border-color'ни shartli beradi, shuning uchun
 * Tailwind'да `border-input` bilan `border-destructive` to'qnashmaydi.
 */
export default function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-2">
        {label}
        {required && (
          <span className="text-destructive ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Standart input/select/textarea klass satri. Xato bo'lsa qizil ramka + qizil fokus
 * halqasi (bitta `border` + shartli border-color — klass to'qnashuvi yo'q).
 */
export function fieldClasses(error?: boolean): string {
  return [
    'w-full px-4 py-2 bg-background border rounded-md text-foreground focus:outline-none focus:ring-2',
    error ? 'border-destructive focus:ring-destructive' : 'border-input focus:ring-ring',
  ].join(' ');
}
