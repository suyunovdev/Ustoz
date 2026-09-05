'use client';

// ─── Brend muhri/belgisi (UstozEdu brandbook v1.0) ───
// Ixcham "U" ochiq kitob + quyosh-nuqta — sertifikat muhri va voda-belgi uchun.
// API (className, animate) o'zgarmagan. Ranglar brend var'lari orqali; chaqiruvchi
// --brand-blue / --brand-sun (yoki eski --girih-line / --girih-star) bilan override qiladi.
// Nomi tarixiy sabab bilan qoladi (ko'p joyda import qilingan).

const BLUE = 'var(--girih-line, var(--brand-blue, #1F5EDC))';
const SUN = 'var(--girih-star, var(--brand-sun, #FFB930))';

export default function GirihEmblem({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`ue-seal ${animate ? 'ue-seal--anim' : ''} ${className}`}
      role="img"
      aria-label="UstozEdu muhri"
      fill="none"
    >
      <style>{`
        .ue-seal--anim { opacity: 0; animation: ue-seal-in 0.8s ease 0.15s forwards; }
        @keyframes ue-seal-in { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .ue-seal--anim { animation: none; opacity: 1; } }
      `}</style>
      <path
        d="M20 16v22a12 12 0 0 0 24 0V26"
        stroke={BLUE}
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="17" r="5.5" fill={SUN} />
    </svg>
  );
}
