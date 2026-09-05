'use client';

import { useId } from 'react';

// ─── Madrasa portali (pishtoq) emblemasi — boyitilgan ───
// To'rtburchak pishtoq ramkasi + konsentrik nishab ravoqlar + ravoq ichida PANJARA
// (madrasa deraza to'ri) + cho'qqida MUQARNAS lobalar + yelka rozettalari + pog'onali
// poydevor + finial. Markaziy Osiyo madrasa me'morchiligi ("Ustoz/ilm" an'anasi).
// Ranglar CSS o'zgaruvchilari orqali (--girih-star asosiy, --girih-line oltin urg'u).
// animate=false — statik (sertifikat/print/voda-belgi). Nomi tarixiy sabab bilan qoladi.

const CREAM = 'var(--girih-star, #F3E4C2)';
const GOLD = 'var(--girih-line, #DFA23A)';
const INNER_ARCH = 'M156 340 V205 C156 165 174 143 200 143 C226 143 244 165 244 205 V340';

export default function GirihEmblem({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const clipId = useId();
  // Panjara (45° to'r) — ravoq ichini to'ldiradi
  const lattice = [];
  for (let k = -10; k <= 10; k++) {
    const o = k * 24;
    lattice.push(
      <path key={`a${k}`} d={`M${140 + o} 360 L${140 + o + 240} 120`} stroke={CREAM} strokeWidth={0.9} strokeOpacity={0.28} />,
      <path key={`b${k}`} d={`M${140 + o} 120 L${140 + o + 240} 360`} stroke={CREAM} strokeWidth={0.9} strokeOpacity={0.28} />,
    );
  }
  // Muqarnas — cho'qqi ostidagi kichik lobalar
  const muqarnas = [];
  for (let i = 0, x = 164; i < 6; i++, x += 12) {
    muqarnas.push(<path key={i} d={`M${x} 128 q6 9 12 0`} stroke={GOLD} strokeWidth={1.1} strokeOpacity={0.8} fill="none" />);
  }

  return (
    <svg
      viewBox="0 0 400 400"
      className={`girih ${animate ? '' : 'girih--static'} ${className}`}
      role="img"
      aria-label="Madrasa portali"
      fill="none"
    >
      <style>{`
        .girih [data-draw] {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: girih-draw 1.9s cubic-bezier(0.65,0,0.35,1) forwards;
        }
        .girih [data-fade] { opacity: 0; animation: girih-fade 0.8s ease 1.1s forwards; }
        @keyframes girih-draw { to { stroke-dashoffset: 0; } }
        @keyframes girih-fade { to { opacity: 1; } }
        .girih--static [data-draw] { animation: none !important; stroke-dashoffset: 0 !important; }
        .girih--static [data-fade] { animation: none !important; opacity: 1 !important; }
        @media (prefers-reduced-motion: reduce) {
          .girih [data-draw] { animation: none; stroke-dashoffset: 0; }
          .girih [data-fade] { animation: none; opacity: 1; }
        }
      `}</style>

      <defs>
        <clipPath id={clipId}>
          <path d={`${INNER_ARCH} Z`} />
        </clipPath>
      </defs>

      {/* Pishtoq ramkasi */}
      <rect data-draw pathLength={1} x="46" y="34" width="308" height="320" rx="10" stroke={CREAM} strokeWidth={2.5} />
      <rect data-draw pathLength={1} x="60" y="48" width="280" height="292" rx="6" stroke={GOLD} strokeWidth={1.2} strokeOpacity={0.55} />

      {/* Tashqi va o'rta ravoqlar */}
      <path data-draw pathLength={1} d="M92 340 V175 C92 108 140 74 200 74 C260 74 308 108 308 175 V340" stroke={CREAM} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
      <path data-draw pathLength={1} d="M124 340 V188 C124 132 158 104 200 104 C242 104 276 132 276 188 V340" stroke={CREAM} strokeWidth={2.2} strokeOpacity={0.85} strokeLinejoin="round" strokeLinecap="round" />

      {/* Panjara (deraza to'ri) — ravoq ichida */}
      <g data-fade clipPath={`url(#${clipId})`}>{lattice}</g>

      {/* Ichki ravoq (oltin) */}
      <path data-draw pathLength={1} d={INNER_ARCH} stroke={GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Muqarnas lobalar */}
      <g data-fade>{muqarnas}</g>

      {/* Pog'onali poydevor */}
      <path data-draw pathLength={1} d="M78 340 H322" stroke={CREAM} strokeWidth={2.6} strokeLinecap="round" />
      <path data-draw pathLength={1} d="M66 353 H334" stroke={CREAM} strokeWidth={2} strokeOpacity={0.7} strokeLinecap="round" />

      {/* Cho'qqi finial */}
      <path data-draw pathLength={1} d="M200 74 V52" stroke={GOLD} strokeWidth={1.6} />
      <path data-fade d="M200 34 l9 11 -9 11 -9 -11 z" fill={GOLD} />
      <circle data-fade cx="200" cy="20" r={3.5} fill={GOLD} />

      {/* Yelka rozettalari + ustun asosi nuqtalari */}
      <circle data-fade cx="84" cy="92" r={5} stroke={GOLD} strokeWidth={1.1} />
      <circle data-fade cx="84" cy="92" r={1.6} fill={GOLD} />
      <circle data-fade cx="316" cy="92" r={5} stroke={GOLD} strokeWidth={1.1} />
      <circle data-fade cx="316" cy="92" r={1.6} fill={GOLD} />
      <circle data-fade cx="92" cy="175" r={3} fill={CREAM} />
      <circle data-fade cx="308" cy="175" r={3} fill={CREAM} />
    </svg>
  );
}
