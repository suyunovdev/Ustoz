'use client';

import { useEffect } from 'react';

/**
 * Global scroll-guard: `type="number"` input fokusda bo'lganda sichqoncha g'ildiragi
 * (wheel) qiymatni beixtiyor o'zgartirib yuborardi. Bu komponent har wheel hodisasida
 * fokusdagi number input'ni blur qiladi — sahifa normal skroll bo'ladi, qiymat esa
 * o'zgarmaydi. Hech qanday inputni alohida o'zgartirish kerak emas (butun ilovaga).
 */
export default function NumericInputGuard() {
  useEffect(() => {
    const onWheel = () => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement && el.type === 'number') {
        el.blur();
      }
    };
    document.addEventListener('wheel', onWheel, { passive: true });
    return () => document.removeEventListener('wheel', onWheel);
  }, []);

  return null;
}
