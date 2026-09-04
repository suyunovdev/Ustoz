'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

// ─── Tema almashtirgich (Yorug' ⇄ Qorong'i) ───
// Mavjud tema tizimiga mos: `ustoz_theme` localStorage + <html>.dark klass
// (layout.tsx boshlang'ich skripti va UserMenu bilan bir xil mexanizm).
// Professional: silliq quyosh/oy o'tishi, klaviatura-fokusli, aria-label.

type Effective = 'light' | 'dark';

function applyTheme(mode: Effective) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

function readInitial(): Effective {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('ustoz_theme');
  if (saved === 'dark') return 'dark';
  if (saved === 'light') return 'light';
  if (saved === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle({
  className = '',
  tone = 'auto',
  variant = 'icon',
}: {
  className?: string;
  // 'auto' — token foreground (light/dark fonga moslashadi); 'onDark' — doim qorong'i
  // band ustida (krem rang), masalan landing dark header.
  tone?: 'auto' | 'onDark';
  // 'icon' — ixcham ikona tugma (header); 'row' — yorliqli to'liq enli qator (sidebar).
  variant?: 'icon' | 'row';
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<Effective>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMode(readInitial());
  }, []);

  const toggle = () => {
    const next: Effective = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try {
      localStorage.setItem('ustoz_theme', next);
    } catch {
      /* ignore */
    }
    applyTheme(next);
  };

  const isDark = mounted && mode === 'dark';
  // Hozirgi holat ikonasi: yorug'da quyosh, qorong'ida oy (amaldagi rejimni bildiradi)
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark');

  // Icon (quyosh/oy) — animatsiyali almashinuv
  const iconStack = (size: number) => (
    <span className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <span
        className="absolute transition-all duration-300"
        style={{ opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(-90deg) scale(0.5)' : 'rotate(0) scale(1)' }}
        aria-hidden
      >
        <Icon name="SunIcon" size={size} variant="solid" />
      </span>
      <span
        className="absolute transition-all duration-300"
        style={{ opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0.5)' }}
        aria-hidden
      >
        <Icon name="MoonIcon" size={size} variant="solid" />
      </span>
    </span>
  );

  // Sidebar uchun — yorliqli to'liq enli qator (logout tugmasi uslubida)
  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-foreground hover:bg-muted transition-smooth text-sm ${className}`}
      >
        {iconStack(18)}
        <span>{label}</span>
      </button>
    );
  }

  const toneClass =
    tone === 'onDark'
      ? 'text-[color:var(--brand-cream)] hover:bg-white/10'
      : 'text-foreground hover:bg-muted';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`relative flex items-center justify-center w-9 h-9 rounded-md transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${toneClass} ${className}`}
    >
      {iconStack(20)}
    </button>
  );
}
