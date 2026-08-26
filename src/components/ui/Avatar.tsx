'use client';

import { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Ismdan deterministik rang — har foydalanuvchi uchun barqaror (SSR-xavfsiz)
const COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-accent',
  'bg-success',
  'bg-info',
  'bg-warning',
];
function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

/**
 * Foydalanuvchi avatari — rasm bo'lsa ko'rsatadi, bo'lmasa yoki yuklanmasa
 * ism bosh harflarini rangli doirada ko'rsatadi (generic placeholder o'rniga).
 */
export default function Avatar({ src, name, size = 48, className = '' }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src && src.trim()) && !failed;

  const box = `rounded-full overflow-hidden flex-shrink-0 ${className}`;
  const style = { width: size, height: size };

  if (showImg) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src as string}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${box} object-cover`}
        style={style}
      />
    );
  }

  return (
    <div
      className={`${box} ${colorFor(name)} flex items-center justify-center text-white font-semibold select-none`}
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      aria-label={name}
      role="img"
    >
      {initialsOf(name)}
    </div>
  );
}
