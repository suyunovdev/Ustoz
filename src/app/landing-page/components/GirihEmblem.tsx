'use client';

// ─── Madrasa ravog'i emblemasi ───
// Markaziy Osiyo madrasa portali (pishtoq/ravoq) — konsentrik nishab ravoqlar.
// Registon madrasalari ilm markazlari bo'lgan; "Ustoz/ilm" an'anasiga bog'liq belgi.
// Ranglar CSS o'zgaruvchilari orqali (--girih-star asosiy, --girih-line urg'u/baza),
// animate=false — statik (sertifikat/print/voda-belgi). Nomi tarixiy sabab bilan
// GirihEmblem bo'lib qoladi (API/import'lar o'zgarmaydi).

export default function GirihEmblem({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={`girih ${animate ? '' : 'girih--static'} ${className}`}
      role="img"
      aria-label="Madrasa ravog'i"
      fill="none"
    >
      <style>{`
        .girih [data-draw] {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: girih-draw 1.7s cubic-bezier(0.65,0,0.35,1) forwards;
        }
        .girih [data-fade] { opacity: 0; animation: girih-fade 0.7s ease 1s forwards; }
        @keyframes girih-draw { to { stroke-dashoffset: 0; } }
        @keyframes girih-fade { to { opacity: 1; } }
        .girih--static [data-draw] { animation: none !important; stroke-dashoffset: 0 !important; }
        .girih--static [data-fade] { animation: none !important; opacity: 1 !important; }
        @media (prefers-reduced-motion: reduce) {
          .girih [data-draw] { animation: none; stroke-dashoffset: 0; }
          .girih [data-fade] { animation: none; opacity: 1; }
        }
      `}</style>

      {/* Tashqi ravoq (pishtoq) */}
      <path
        data-draw
        pathLength={1}
        d="M67 348 V165 C67 82 120 42 200 42 C280 42 333 82 333 165 V348"
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* O'rta ravoq */}
      <path
        data-draw
        pathLength={1}
        d="M112 348 V180 C112 112 148 82 200 82 C252 82 288 112 288 180 V348"
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={2.5}
        strokeOpacity={0.85}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Ichki ravoq (oltin urg'u) */}
      <path
        data-draw
        pathLength={1}
        d="M157 348 V205 C157 158 175 135 200 135 C225 135 243 158 243 205 V348"
        stroke="var(--girih-line, #DFA23A)"
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Poydevor chizig'i */}
      <path
        data-draw
        pathLength={1}
        d="M44 348 H356"
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Cho'qqi bezagi (romb) */}
      <path data-fade d="M200 24 l10 12 -10 12 -10 -12 z" fill="var(--girih-line, #DFA23A)" />
    </svg>
  );
}
