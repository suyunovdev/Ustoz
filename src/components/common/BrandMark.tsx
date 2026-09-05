import type { CSSProperties } from 'react';

// ─── Yagona brend belgisi (UstozEdu brandbook v1.0) ───
// "U" shaklidagi ochiq kitob + quyosh-nuqta. Chap ustun = ustoz, o'ng qisqa ustun =
// o'quvchi, sariq nuqta = bilim uchquni. Loyihadagi BARCHA logo joylari shu komponentdan
// foydalanadi. Standart holatda fonsiz (gorizontal logo uslubi); tileColor berilsa
// yumaloq plitka ichida (favicon/avatar). Ranglar brend CSS var'lari orqali.
// Belgi SVG manbasi brandbook 08-bo'limidan.

export default function BrandMark({
  size = 36,
  className = '',
  tileColor = 'transparent',
  markColor = 'var(--brand-blue)',
  dotColor = 'var(--brand-sun)',
  rounded,
  shadow = false,
}: {
  size?: number;
  className?: string;
  tileColor?: string; // plitka foni (default fonsiz)
  markColor?: string; // "U" belgisi rangi (default Ustoz ko'ki)
  dotColor?: string; // quyosh nuqta rangi (default Quyosh)
  rounded?: number;
  shadow?: boolean;
}) {
  const tiled = tileColor !== 'transparent';
  // Plitkada belgi biroz ichkarida turadi; fonsiz — to'liq egallaydi.
  const glyph = tiled ? Math.round(size * 0.66) : size;
  const style: CSSProperties = {
    width: size,
    height: size,
    background: tileColor,
    borderRadius: tiled ? (rounded ?? Math.round(size * 0.28)) : undefined,
  };
  if (shadow) style.boxShadow = '0 2px 12px rgba(31,94,220,0.28)';

  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 ${className}`} style={style}>
      <svg width={glyph} height={glyph} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        {/* "U" ochiq kitob — chap uzun (ustoz), o'ng qisqa (o'quvchi) */}
        <path
          d="M17 12v24a15 15 0 0 0 30 0V26"
          stroke={markColor}
          strokeWidth={9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Quyosh-nuqta — bilim uchquni */}
        <circle cx="47" cy="13" r="6" fill={dotColor} />
      </svg>
    </span>
  );
}
