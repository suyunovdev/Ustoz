'use client';

import { useId } from 'react';

// ─── Brend grafikasi (UstozEdu brandbook v1.0) ───
// Nuqtali to'r ("daftar varag'i") + katta "U" ochiq kitob belgisi + quyosh-nuqta.
// Hero, voda-belgi, auth panel va sertifikatda dekorativ motiv sifatida ishlatiladi.
// API (className, animate) o'zgarmagan — barcha ishlatilish joyi avtomatik yangilanadi.
// Ranglar brend var'lari; chaqiruvchi --brand-blue/--brand-sun'ni override qilishi mumkin.

const BLUE = 'var(--brand-blue, #1F5EDC)';
const SUN = 'var(--brand-sun, #FFB930)';

export default function RegistonEmblem({
  className = '',
  animate = true,
}: {
  className?: string;
  animate?: boolean;
}) {
  const dotId = useId();
  return (
    <svg
      viewBox="0 0 400 360"
      className={`ue-glyph ${animate ? 'ue-glyph--anim' : ''} ${className}`}
      role="img"
      aria-label="UstozEdu belgisi"
      fill="none"
    >
      <style>{`
        .ue-glyph--anim { opacity: 0; animation: ue-glyph-in 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s forwards; }
        @keyframes ue-glyph-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .ue-glyph--anim { animation: none; opacity: 1; transform: none; } }
      `}</style>

      <defs>
        <pattern id={dotId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="2" fill={BLUE} opacity="0.22" />
        </pattern>
      </defs>

      {/* Nuqtali to'r foni */}
      <rect x="0" y="0" width="400" height="360" fill={`url(#${dotId})`} />

      {/* Katta "U" ochiq kitob belgisi — chap uzun (ustoz), o'ng qisqa (o'quvchi) */}
      <path
        d="M132 96 V208 A68 68 0 0 0 268 208 V128"
        stroke={BLUE}
        strokeWidth={40}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Quyosh-nuqta — bilim uchquni */}
      <circle cx="268" cy="98" r="27" fill={SUN} />
    </svg>
  );
}
