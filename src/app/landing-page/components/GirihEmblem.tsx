'use client';

// ─── Girih emblema ───
// Markaziy Osiyo / Islom geometriyasi: 8-burchakli o'zaro bog'langan yulduz (girih).
// Bu motif matematika, aniqlik va ustalik (ustachilik) ramzi — "Ustoz" brendining
// ilmiy-meros ohangini beradi. Barcha geometriya JS'da hisoblanadi (mukammal
// simmetriya), yuklanishda chiziq-chizish (line-draw) animatsiyasi bilan chiqadi.
// prefers-reduced-motion: animatsiyasiz, darhol to'liq ko'rinadi.

const CX = 200;
const CY = 200;

function pt(r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

// n-burchak (octagon va h.k.) yopiq path
function polygon(r: number, sides: number, rot = 0): string {
  const step = 360 / sides;
  const pts = Array.from({ length: sides }, (_, i) => pt(r, rot + i * step));
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ') + ' Z';
}

// {8/m} yulduz-ko'pburchak (octagram) — har m-chi nuqtaga ulanadi
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

export default function GirihEmblem({ className = '' }: { className?: string }) {
  const spokes = Array.from({ length: 16 }, (_, i) => {
    const [x1, y1] = pt(40, i * 22.5);
    const [x2, y2] = pt(190, i * 22.5);
    return { x1, y1, x2, y2, i };
  });
  const tips = Array.from({ length: 8 }, (_, i) => pt(180, i * 45));

  return (
    <svg
      viewBox="0 0 400 400"
      className={`girih ${className}`}
      role="img"
      aria-label="Girih geometrik naqsh"
      fill="none"
    >
      <style>{`
        .girih [data-draw] {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: girih-draw 2.2s cubic-bezier(0.65,0,0.35,1) forwards;
        }
        .girih [data-fade] { opacity: 0; animation: girih-fade 1s ease forwards; }
        @keyframes girih-draw { to { stroke-dashoffset: 0; } }
        @keyframes girih-fade { to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .girih [data-draw] { animation: none; stroke-dashoffset: 0; }
          .girih [data-fade] { animation: none; opacity: 1; }
        }
      `}</style>

      {/* konsentrik sakkiz-burchaklar */}
      {[196, 150].map((r, i) => (
        <path
          key={`oct-${r}`}
          data-draw
          pathLength={1}
          d={polygon(r, 8, i % 2 ? 22.5 : 0)}
          stroke="var(--girih-line, #E0A032)"
          strokeWidth={i === 0 ? 1 : 1.25}
          strokeOpacity={i === 0 ? 0.35 : 0.55}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}

      {/* radial spoke'lar */}
      {spokes.map((s) => (
        <line
          key={`sp-${s.i}`}
          data-draw
          pathLength={1}
          x1={s.x1}
          y1={s.y1}
          x2={s.x2}
          y2={s.y2}
          stroke="var(--girih-line, #E0A032)"
          strokeWidth={0.75}
          strokeOpacity={0.22}
          style={{ animationDelay: `${0.2 + (s.i % 8) * 0.03}s` }}
        />
      ))}

      {/* asosiy octagram yulduzlar (o'zaro bog'langan) */}
      <path
        data-draw
        pathLength={1}
        d={starPolygon(180, 3, 0)}
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={1.75}
        strokeOpacity={0.9}
        strokeLinejoin="round"
        style={{ animationDelay: '0.35s' }}
      />
      <path
        data-draw
        pathLength={1}
        d={starPolygon(180, 3, 22.5)}
        stroke="var(--girih-line, #E0A032)"
        strokeWidth={1.5}
        strokeOpacity={0.75}
        strokeLinejoin="round"
        style={{ animationDelay: '0.55s' }}
      />
      {/* ichki octagram */}
      <path
        data-draw
        pathLength={1}
        d={starPolygon(112, 3, 0)}
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={1.5}
        strokeOpacity={0.85}
        strokeLinejoin="round"
        style={{ animationDelay: '0.75s' }}
      />

      {/* markaziy sakkiz-burchak yadro */}
      <path
        data-draw
        pathLength={1}
        d={polygon(46, 8, 22.5)}
        stroke="var(--girih-star, #F3E4C2)"
        strokeWidth={1.5}
        strokeOpacity={0.9}
        style={{ animationDelay: '0.9s' }}
      />

      {/* yulduz uchlaridagi tugun nuqtalari */}
      {tips.map(([x, y], i) => (
        <circle
          key={`tip-${i}`}
          data-fade
          cx={x}
          cy={y}
          r={3}
          fill="var(--girih-line, #E0A032)"
          style={{ animationDelay: `${1.4 + i * 0.05}s` }}
        />
      ))}
      {/* markaziy nuqta */}
      <circle data-fade cx={CX} cy={CY} r={4.5} fill="var(--girih-star, #F3E4C2)" style={{ animationDelay: '1.3s' }} />
    </svg>
  );
}
