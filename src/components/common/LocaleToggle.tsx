'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';
import type { Locale } from '@/lib/i18n';

// ─── Til almashtirgich (uz/ru/en) ───
// useI18n.setLocale ustoz_lang cookie + localStorage'ni yozadi — client komponentlar
// darhol yangilanadi. router.refresh() esa server-render qismlarni (masalan auth brend
// paneli, footer) yangi cookie bo'yicha qayta render qiladi — butun sahifa izchil.
// Auth sahifalari yuqori qatorida (ThemeToggle yonida) ishlatiladi.

const LANGS: Locale[] = ['uz', 'ru', 'en'];

export default function LocaleToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const router = useRouter();
  return (
    <div
      className={`inline-flex items-center rounded-full p-0.5 border border-border ${className}`}
      role="group"
      aria-label="Til / Language"
    >
      {LANGS.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => { setLocale(l); router.refresh(); }}
            aria-pressed={active}
            className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
