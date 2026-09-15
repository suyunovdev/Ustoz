'use client';

import { useEffect, useRef, useState } from 'react';

type Props = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type'
> & {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Bo'sh maydonda blur bo'lganda qaytariladigan qiymat (default: min ?? 0). */
  emptyValue?: number;
};

/**
 * Raqamli input — `<input type="number">` noqulayliklarini hal qiladi:
 *   - qiymatni 0 qilish yoki maydonni BO'SHATIB qayta yozish mumkin
 *     (oddiy `Number(v) || 1` naqshida 0 falsy bo'lib 1 ga qaytardi);
 *   - min/max faqat BLUR paytida qo'llanadi (yozayotganda oraliq qiymatlarni buzmaydi);
 *   - spinner strelkalar global CSS'da yashiringan, scroll-guard layout'da (type="number" saqlanadi).
 */
export default function NumberInput({
  value,
  onValueChange,
  min,
  max,
  emptyValue,
  onFocus,
  onBlur,
  ...rest
}: Props) {
  const [text, setText] = useState<string>(() => String(value));
  const focused = useRef(false);

  // Tashqi qiymat o'zgarsa (masalan forma reset) — faqat fokusda BO'LMAGANDA sinxronlaymiz,
  // aks holda yozayotgan matnni buzardi.
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      value={text}
      min={min}
      max={max}
      onFocus={(e) => {
        focused.current = true;
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        // Bo'sh yoki yarim-kiritilgan (masalan "-") holatda parent'ni majburlamaymiz —
        // shu tufayli 0 yozish va maydonni bo'shatish mumkin bo'ladi.
        if (raw !== '' && raw !== '-' && !Number.isNaN(Number(raw))) {
          onValueChange(Number(raw));
        }
      }}
      onBlur={(e) => {
        focused.current = false;
        const raw = e.target.value;
        let n: number;
        if (raw === '' || raw === '-' || Number.isNaN(Number(raw))) {
          n = emptyValue ?? min ?? 0;
        } else {
          n = Number(raw);
          if (min !== undefined) n = Math.max(min, n);
          if (max !== undefined) n = Math.min(max, n);
        }
        setText(String(n));
        onValueChange(n);
        onBlur?.(e);
      }}
    />
  );
}
