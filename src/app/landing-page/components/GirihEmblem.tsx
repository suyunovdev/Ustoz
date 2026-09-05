'use client';

// ─── Girih yulduzi (toza, minimal) ───
// Bitta aniq 8-nurli o'zaro bog'langan girih yulduzi ({8/3} octagram) — Markaziy
// Osiyo geometriyasi, matematika/aniqlik/meros ramzi. Ilgarigi ko'p qatlamli
// "shovqinli" mandala o'rniga bitta toza yulduz. Barcha o'lchamda (favicon'dan
// hero'gacha) aniq ko'rinadi. Ranglar CSS o'zgaruvchilari orqali (--girih-star yulduz,
// --girih-line markaz), animate=false — statik (sertifikat/print/voda-belgi).

const CX = 200;
const CY = 200;

function pt(r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

// {8/skip} yulduz-ko'pburchak (octagram) — uzluksiz o'zaro bog'langan yulduz
function starPolygon(r: number, skip: number, rot = 0): string {
  const n = 8;
  const idx: number[] = [];
  let cur = 0;
  do {
    idx.push(cur);
    cur = (cur + skip) % n;
  } while (cur !== 0);
  const pts = idx.map((i) => pt(r, rot + (i * 360) / n));
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + ' Z';
}

export default function GirihEmblem({
  className = '',
  animate = true,
}: {
  className?: string;
  // false — animatsiyasiz, darhol to'liq (sertifikat/print/voda-belgi uchun)
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={`girih ${animate ? '' : 'girih--static'} ${className}`}
      role="img"
      aria-label="Girih yulduzi"
      fill="none"
    >
      <style>{`
        .girih [data-draw] {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: girih-draw 1.6s cubic-bezier(0.65,0,0.35,1) forwards;
        }
        .girih [data-fade] { opacity: 0; animation: girih-fade 0.8s ease 0.9s forwards; }
        @keyframes girih-draw { to { stroke-dashoffset: 0; } }
        @keyframes girih-fade { to { opacity: 1; } }
        .girih--static [data-draw] { animation: none !important; stroke-dashoffset: 0 !important; }
        .girih--static [data-fade] { animation: none !important; opacity: 1 !important; }
        @media (prefers-reduced-motion: reduce) {
          .girih [data-draw] { animation: none; stroke-dashoffset: 0; }
          .girih [data-fade] { animation: none; opacity: 1; }
        }
      `}</style>

      {/* Asosiy octagram yulduz */}
      <path
        data-draw
        pathLength={1}
        d={starPolygon(176, 3)}
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Markaziy nuqta */}
      <circle data-fade cx={CX} cy={CY} r={6} fill="var(--girih-line, #DFA23A)" />
    </svg>
  );
}
