import type { CSSProperties } from 'react';

// ═══ Auth palitrasi ═══
// Landing bilan bir xil "qog'oz + siyoh" brend tili. Endi qat'iy hex EMAS — semantik
// brend CSS-o'zgaruvchilariga bog'langan (tailwind.css :root / .dark), shuning uchun
// tema (light/dark) toggle'iga to'liq javob beradi.
export const AUTH_INK = 'var(--brand-band)';
export const AUTH_INK_DEEP = 'var(--brand-band-deep)';
export const AUTH_PAPER = 'var(--brand-page)';
export const AUTH_GOLD = 'var(--brand-gold)';
export const AUTH_INK_TEXT = 'var(--brand-text)';

// Forma ustuniga qo'llaniladigan token qayta-belgilashlari. Barcha qiymat brend
// o'zgaruvchisi orqali — .dark klassida avtomatik qorong'i variantga o'tadi.
export const AUTH_FORM_REMAP = {
  '--color-primary': 'var(--brand-primary)',
  '--color-primary-foreground': 'var(--brand-primary-fg)',
  '--color-ring': 'var(--brand-gold)',
  '--color-accent': 'var(--brand-gold)',
  '--color-accent-foreground': 'var(--brand-band)',
  '--color-secondary': 'var(--brand-malachite)',
  '--color-background': 'var(--brand-surface-2)',
  '--color-card': 'var(--brand-surface-2)',
  '--color-foreground': 'var(--brand-text)',
  '--color-muted': 'var(--brand-muted-surface)',
  '--color-muted-foreground': 'var(--brand-text-mute)',
  '--color-border': 'var(--brand-line)',
  '--color-input': 'var(--brand-input-border)',
} as CSSProperties;
