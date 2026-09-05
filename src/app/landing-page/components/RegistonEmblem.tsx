'use client';

import { useId } from 'react';

// ─── Registon ansambli emblemasi ───
// Samarqand Registon maydoni: uch madrasa (Ulug'bek, Sherdor, Tillakori) — grand
// iwan portallari, qovurg'ali gumbazlar, minoralar, markaziy iwanda panjara.
// "Ustoz/ilm" merosining eng yorqin ramzi. Katta/dekorativ joylarda ishlatiladi
// (hero, voda-belgilar, sertifikat voda-belgisi). Kichik muhr — sodda GirihEmblem.
// Ranglar CSS o'zgaruvchilari orqali (--girih-star asosiy, --girih-line oltin).

const CREAM = 'var(--girih-star, #F3E4C2)';
const GOLD = 'var(--girih-line, #DFA23A)';

function Dome({ cx, cy, r, col }: { cx: number; cy: number; r: number; col: string }) {
  return (
    <g>
      <path
        d={`M${cx - r} ${cy} C${cx - r} ${cy - r * 1.5} ${cx - r * 0.5} ${cy - r * 1.9} ${cx} ${cy - r * 2} C${cx + r * 0.5} ${cy - r * 1.9} ${cx + r} ${cy - r * 1.5} ${cx + r} ${cy} Z`}
        stroke={col}
        strokeWidth={2}
      />
      <path d={`M${cx} ${cy - r * 2} V${cy}`} stroke={col} strokeWidth={1} strokeOpacity={0.55} />
      <path d={`M${cx - r * 0.55} ${cy - r * 0.2} C${cx - r * 0.5} ${cy - r} ${cx - r * 0.25} ${cy - r * 1.6} ${cx} ${cy - r * 1.9}`} stroke={col} strokeWidth={1} strokeOpacity={0.5} />
      <path d={`M${cx + r * 0.55} ${cy - r * 0.2} C${cx + r * 0.5} ${cy - r} ${cx + r * 0.25} ${cy - r * 1.6} ${cx} ${cy - r * 1.9}`} stroke={col} strokeWidth={1} strokeOpacity={0.5} />
      <path d={`M${cx} ${cy - r * 2} V${cy - r * 2 - 10}`} stroke={GOLD} strokeWidth={1.4} />
      <circle cx={cx} cy={cy - r * 2 - 14} r={2.6} fill={GOLD} />
      <path d={`M${cx - r} ${cy} V${cy + 14} M${cx + r} ${cy} V${cy + 14}`} stroke={col} strokeWidth={2} />
    </g>
  );
}

function Iwan({ cx, hw, yTop, yBot, col, sw }: { cx: number; hw: number; yTop: number; yBot: number; col: string; sw: number }) {
  return (
    <path
      d={`M${cx - hw} ${yBot} V${yTop + hw * 0.7} C${cx - hw} ${yTop} ${cx - hw * 0.4} ${yTop - hw * 0.5} ${cx} ${yTop - hw * 0.5} C${cx + hw * 0.4} ${yTop - hw * 0.5} ${cx + hw} ${yTop} ${cx + hw} ${yTop + hw * 0.7} V${yBot}`}
      stroke={col}
      strokeWidth={sw}
      strokeLinejoin="round"
      fill="none"
    />
  );
}

function Frame({ x1, x2, yTop, yBot }: { x1: number; x2: number; yTop: number; yBot: number }) {
  return <rect x={x1} y={yTop} width={x2 - x1} height={yBot - yTop} rx={4} stroke={CREAM} strokeWidth={2} />;
}

function Minaret({ cx, yTop, yBot, w }: { cx: number; yTop: number; yBot: number; w: number }) {
  const band = yBot * 0.55 + yTop * 0.45;
  return (
    <g>
      <path d={`M${cx - w} ${yBot} L${cx - w * 0.7} ${yTop} M${cx + w} ${yBot} L${cx + w * 0.7} ${yTop}`} stroke={CREAM} strokeWidth={1.8} />
      <path d={`M${cx - w * 0.85} ${band} H${cx + w * 0.85}`} stroke={CREAM} strokeWidth={1.2} strokeOpacity={0.6} />
      <rect x={cx - w * 0.9} y={yTop - 14} width={w * 1.8} height={14} stroke={CREAM} strokeWidth={1.4} />
      <path d={`M${cx - w * 0.9} ${yTop - 14} Q${cx} ${yTop - 30} ${cx + w * 0.9} ${yTop - 14}`} stroke={GOLD} strokeWidth={1.4} fill="none" />
      <circle cx={cx} cy={yTop - 33} r={2.2} fill={GOLD} />
    </g>
  );
}

export default function RegistonEmblem({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const clipId = useId();
  const lattice = [];
  for (let k = -6; k <= 6; k++) {
    const o = k * 14;
    lattice.push(
      <path key={`a${k}`} d={`M${175 + o} 300 L${175 + o + 70} 220`} stroke={CREAM} strokeWidth={0.7} strokeOpacity={0.3} />,
      <path key={`b${k}`} d={`M${175 + o} 220 L${175 + o + 70} 300`} stroke={CREAM} strokeWidth={0.7} strokeOpacity={0.3} />,
    );
  }

  return (
    <svg
      viewBox="0 0 420 340"
      className={`registon ${animate ? 'registon--anim' : ''} ${className}`}
      role="img"
      aria-label="Registon ansambli"
      fill="none"
    >
      <style>{`
        .registon--anim { opacity: 0; animation: registon-in 1s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; transform-box: fill-box; }
        @keyframes registon-in { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .registon--anim { animation: none; opacity: 1; transform: none; } }
      `}</style>

      <defs>
        <clipPath id={clipId}>
          <path d="M172 300 V210 C172 178 188 160 210 160 C232 160 248 178 248 210 V300 Z" />
        </clipPath>
      </defs>

      {/* Orqa gumbazlar */}
      <Dome cx={112} cy={150} r={26} col={CREAM} />
      <Dome cx={308} cy={150} r={26} col={CREAM} />
      <Dome cx={210} cy={120} r={40} col={CREAM} />

      {/* Minoralar */}
      <Minaret cx={40} yTop={120} yBot={300} w={7} />
      <Minaret cx={380} yTop={120} yBot={300} w={7} />
      <Minaret cx={150} yTop={150} yBot={300} w={5} />
      <Minaret cx={270} yTop={150} yBot={300} w={5} />

      {/* Yon madrasalar */}
      <Frame x1={62} x2={138} yTop={175} yBot={300} />
      <Iwan cx={100} hw={26} yTop={205} yBot={300} col={CREAM} sw={2} />
      <Frame x1={282} x2={358} yTop={175} yBot={300} />
      <Iwan cx={320} hw={26} yTop={205} yBot={300} col={CREAM} sw={2} />

      {/* Markaziy madrasa */}
      <Frame x1={158} x2={262} yTop={120} yBot={300} />
      <Iwan cx={210} hw={38} yTop={165} yBot={300} col={CREAM} sw={2.4} />
      <g clipPath={`url(#${clipId})`}>{lattice}</g>
      <Iwan cx={210} hw={26} yTop={205} yBot={300} col={GOLD} sw={1.6} />

      {/* Yer chizig'i */}
      <path d="M20 300 H400" stroke={CREAM} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M35 310 H385" stroke={CREAM} strokeWidth={1.6} strokeOpacity={0.6} strokeLinecap="round" />
    </svg>
  );
}
