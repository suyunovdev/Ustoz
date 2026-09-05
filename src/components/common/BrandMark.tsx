import type { CSSProperties } from 'react';

// ─── Yagona brend belgisi (logo) ───
// Oltin dumaloq plitka ichida madrasa ravog'i (pishtoq) belgisi. Loyihadagi BARCHA
// logo joylari shu komponentdan foydalanadi — belgi bir joyda boshqariladi.
// Emblema (hero/voda-belgi/muhr) — alohida `GirihEmblem` (batafsil konsentrik ravoqlar).

export default function BrandMark({
  size = 36,
  className = '',
  tileColor = 'var(--brand-gold)',
  markColor = 'var(--brand-band)',
  rounded,
  shadow = false,
}: {
  size?: number;
  className?: string;
  tileColor?: string; // plitka foni (default oltin)
  markColor?: string; // belgi rangi (default siyoh)
  rounded?: number;
  shadow?: boolean;
}) {
  const inner = Math.round(size * 0.62);
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: rounded ?? Math.round(size * 0.28),
    background: tileColor,
  };
  if (shadow) style.boxShadow = '0 2px 10px rgba(223,162,58,0.35)';
  const sw = 1.7;
  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 ${className}`} style={style}>
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {/* tashqi ravoq */}
        <path
          d="M5 20 V11 C5 6 8 3.5 12 3.5 C16 3.5 19 6 19 11 V20"
          stroke={markColor}
          strokeWidth={sw}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* ichki ravoq */}
        <path
          d="M9.5 20 V12.6 C9.5 10 10.6 8.6 12 8.6 C13.4 8.6 14.5 10 14.5 12.6 V20"
          stroke={markColor}
          strokeWidth={sw}
          strokeOpacity={0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* poydevor */}
        <path d="M3.5 20 H20.5" stroke={markColor} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    </span>
  );
}
