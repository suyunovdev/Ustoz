'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  type Locale,
  type TParams,
  DEFAULT_LOCALE,
  getTranslation,
  getLocaleFromStorage,
  saveLocaleToStorage,
} from '@/lib/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: TParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getLocaleFromStorage());
  }, []);

  // <html lang> ni joriy tilga moslash (a11y + SEO; skrinreader to'g'ri o'qiydi)
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocaleToStorage(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: TParams) => getTranslation(locale, key, params),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}
