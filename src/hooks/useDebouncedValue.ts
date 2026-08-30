'use client';

import { useEffect, useState } from 'react';

/**
 * Qiymatni belgilangan kechikish bilan "debounce" qiladi. Qidiruv input'i har
 * harf bosishda emas, foydalanuvchi to'xtagach yangilanadi — ortiqcha so'rovlar
 * (masalan og'ir aggregate API) oldini oladi.
 *
 * @param value    kuzatilayotgan qiymat
 * @param delayMs  kechikish (ms), default 300
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
