'use client';

/**
 * MaterialPlayer — talaba materialni ko'rganda ishlatiladigan player.
 *
 * Watermark: video ustida talaba ismi + qisqa ID overlay sifatida ko'rinadi
 * (random pozitsiya, har 7 sek'da o'zgaradi — ekran yozib olishni qiyinlashtiradi).
 *
 * Eslatma: bu — *cosmetic* watermark, real DRM emas. Brauzer extension
 * yoki screen-record orqali olish mumkin. Real himoya uchun Cloudflare Stream
 * yoki shop4D kabi xizmat kerak (V2 reja).
 */

import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  materialId: string;
  fileUrl: string;
  materialType: 'video' | 'audio' | 'document' | 'image' | 'external_link';
  viewerName?: string;
  viewerId?: string;
  /** View'ni tracking endpoint'ga yozish callback'i */
  onView?: (watchSec: number) => void;
}

const WATERMARK_PERIOD_MS = 7000;
const WATERMARK_POSITIONS = [
  { top: '10%', left: '5%' },
  { top: '10%', right: '5%' },
  { top: '40%', left: '8%' },
  { top: '40%', right: '8%' },
  { bottom: '15%', left: '6%' },
  { bottom: '15%', right: '6%' },
  { top: '70%', left: '40%' },
];

const MaterialPlayer = ({
  materialId,
  fileUrl,
  materialType,
  viewerName,
  viewerId,
  onView,
}: Props) => {
  const [positionIdx, setPositionIdx] = useState(0);
  const watchSecRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  const watermarkLabel = useMemo(() => {
    const name = viewerName || 'Talaba';
    const idSuffix = viewerId ? ` · ${viewerId.slice(0, 6)}` : '';
    return `${name}${idSuffix}`;
  }, [viewerName, viewerId]);

  useEffect(() => {
    if (materialType !== 'video' && materialType !== 'audio') return;
    const id = setInterval(() => {
      setPositionIdx((i) => (i + 1) % WATERMARK_POSITIONS.length);
    }, WATERMARK_PERIOD_MS);
    return () => clearInterval(id);
  }, [materialType]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    return () => {
      if (startedAtRef.current && onView) {
        const elapsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
        if (elapsedSec >= 3) {
          onView(elapsedSec);
        }
      }
    };
  }, [materialId, onView]);

  const isYouTube = useMemo(() => {
    try {
      const u = new URL(fileUrl);
      return (
        u.hostname.includes('youtube.com') ||
        u.hostname === 'youtu.be' ||
        u.hostname === 'm.youtube.com'
      );
    } catch {
      return false;
    }
  }, [fileUrl]);

  const youtubeEmbedUrl = useMemo(() => {
    if (!isYouTube) return null;
    try {
      const u = new URL(fileUrl);
      let videoId = '';
      if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1);
      } else {
        videoId = u.searchParams.get('v') || '';
      }
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    } catch {
      return null;
    }
  }, [fileUrl, isYouTube]);

  const positionStyle = WATERMARK_POSITIONS[positionIdx];

  if (materialType === 'video') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
        {youtubeEmbedUrl ? (
          <iframe
            src={youtubeEmbedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`material-${materialId}`}
          />
        ) : (
          <video src={fileUrl} controls className="w-full h-full" preload="metadata" />
        )}
        <div
          className="absolute pointer-events-none select-none text-white/40 text-xs sm:text-sm font-mono backdrop-blur-[1px] px-2 py-1 rounded transition-all duration-700"
          style={{ ...positionStyle, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {watermarkLabel}
        </div>
      </div>
    );
  }

  if (materialType === 'audio') {
    return (
      <div className="relative w-full p-4 bg-muted/30 rounded-md">
        <audio src={fileUrl} controls className="w-full" />
        <div
          className="absolute pointer-events-none select-none text-foreground/30 text-xs font-mono"
          style={positionStyle}
        >
          {watermarkLabel}
        </div>
      </div>
    );
  }

  if (materialType === 'image') {
    return (
      <div className="relative inline-block max-w-full">
        <img src={fileUrl} alt={`material-${materialId}`} className="max-w-full rounded-md" />
        <div
          className="absolute pointer-events-none select-none text-white/50 text-xs font-mono backdrop-blur-[1px] px-2 py-1"
          style={{ ...positionStyle, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
        >
          {watermarkLabel}
        </div>
      </div>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm"
    >
      Ochish ↗
    </a>
  );
};

export default MaterialPlayer;
