import type { CSSProperties } from 'react';

// ─── Yagona brend belgisi (logo) ───
// Oltin dumaloq plitka ichida to'ldirilgan 8-nurli girih yulduzi. Loyihadagi BARCHA
// logo joylari shu komponentdan foydalanadi — belgi bir joyda boshqariladi (izchillik).
// Emblema (hero/voda-belgi/muhr) — alohida `GirihEmblem` (chiziqli, batafsil).

export const BRAND_STAR_PATH =
  'M12 1.5l2.4 5.1 5.6.7-4.1 3.9 1.1 5.6L12 19.9 6.9 22.8 8 17.2 3.9 13.3l5.6-.7L12 1.5z';

export default function BrandMark({
  size = 36,
  className = '',
  tileColor = 'var(--brand-gold)',
  starColor = 'var(--brand-band)',
  rounded,
  shadow = false,
}: {
  size?: number;
  className?: string;
  tileColor?: string; // plitka foni (default oltin)
  starColor?: string; // yulduz rangi (default siyoh)
  rounded?: number; // burchak radiusi (default o'lchamning ~28%)
  shadow?: boolean;
}) {
  const inner = Math.round(size * 0.53);
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: rounded ?? Math.round(size * 0.28),
    background: tileColor,
  };
  if (shadow) style.boxShadow = '0 2px 10px rgba(223,162,58,0.35)';
  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 ${className}`} style={style}>
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={BRAND_STAR_PATH} fill={starColor} />
      </svg>
    </span>
  );
}
