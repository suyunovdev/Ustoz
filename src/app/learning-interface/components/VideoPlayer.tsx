'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { parseVideoSource, isEmbedKind } from '@/lib/video';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onToggleSidebar: () => void;
}

function formatTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const VideoPlayer = ({
  videoUrl,
  title,
  currentTime,
  onTimeUpdate,
  playbackSpeed,
  onSpeedChange,
  onToggleSidebar,
}: VideoPlayerProps) => {
  const source = parseVideoSource(videoUrl);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // playbackSpeed prop → haqiqiy playbackRate
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, source.kind]);

  // Tashqi seek (transkript/eslatma bosilganda parent currentTime'ni o'zgartiradi)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (Math.abs(v.currentTime - currentTime) > 1) {
      v.currentTime = currentTime;
    }
  }, [currentTime]);

  // Fullscreen holatini kuzatish
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => setHasError(true));
    } else {
      v.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const v = videoRef.current;
    setVolume(val);
    if (v) {
      v.volume = val;
      v.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const v = videoRef.current;
    if (v) v.currentTime = val;
    setPlayed(val);
    onTimeUpdate(val);
  };

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  // ── iframe manbalar (YouTube / Vimeo / Cloudflare Stream) ──────────────
  if (isEmbedKind(source.kind) && source.embedUrl) {
    return (
      <div ref={containerRef} className="relative aspect-video bg-black w-full h-full">
        <iframe
          src={source.embedUrl}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
        {/* Sidebar toggle — iframe ustida suzuvchi tugma */}
        <button
          onClick={onToggleSidebar}
          aria-label="Yon panelni ochish/yopish"
          className="absolute top-3 left-3 z-10 p-2 rounded-md bg-black/60 hover:bg-black/80 transition-smooth"
        >
          <Icon name="Bars3Icon" size={20} className="text-white" />
        </button>
      </div>
    );
  }

  // ── Noto'g'ri / qo'llab-quvvatlanmaydigan manba ────────────────────────
  if (source.kind === 'none' || source.kind === 'unknown' || hasError) {
    return (
      <div className="relative aspect-video bg-black w-full h-full flex items-center justify-center">
        <div className="text-center space-y-3 px-4">
          <Icon name="ExclamationTriangleIcon" size={56} className="text-white/40 mx-auto" />
          <p className="text-white/70 text-sm">
            {hasError
              ? 'Video yuklab bo‘lmadi. Havolani tekshiring.'
              : source.kind === 'none'
                ? 'Bu mavzu uchun video biriktirilmagan.'
                : 'Video havolasi noto‘g‘ri yoki qo‘llab-quvvatlanmaydi (YouTube, Vimeo yoki MP4 kutilyapti).'}
          </p>
          <p className="text-white/40 text-xs">{title}</p>
        </div>
      </div>
    );
  }

  // ── HTML5 <video> (bevosita fayl / R2) ─────────────────────────────────
  return (
    <div ref={containerRef} className="relative aspect-video bg-black w-full h-full group">
      <video
        ref={videoRef}
        src={source.fileUrl}
        className="absolute inset-0 w-full h-full"
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setHasError(true)}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          setDuration(v.duration);
          v.playbackRate = playbackSpeed;
          v.volume = volume;
        }}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setPlayed(t);
          onTimeUpdate(t);
        }}
      />

      {/* Boshqaruv qatlami */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {/* Yuqori panel */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={onToggleSidebar}
            aria-label="Yon panelni ochish/yopish"
            className="p-2 rounded-md bg-black/50 hover:bg-black/70 transition-smooth"
          >
            <Icon name="Bars3Icon" size={20} className="text-white" />
          </button>
          <h3 className="text-white font-medium text-sm truncate max-w-[60%]">{title}</h3>
          <div className="w-10" />
        </div>

        {/* Markaziy play tugmasi */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pauza' : 'Ijro'}
            className="pointer-events-auto p-4 rounded-full bg-primary hover:bg-primary/90 transition-smooth"
          >
            <Icon
              name={isPlaying ? 'PauseIcon' : 'PlayIcon'}
              size={32}
              className="text-primary-foreground"
              variant="solid"
            />
          </button>
        </div>

        {/* Pastki boshqaruvlar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Progress */}
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={played}
            onChange={handleSeek}
            aria-label="Video vaqti"
            className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pauza' : 'Ijro'}
                className="p-1.5 rounded-md hover:bg-white/10 transition-smooth"
              >
                <Icon
                  name={isPlaying ? 'PauseIcon' : 'PlayIcon'}
                  size={20}
                  className="text-white"
                  variant="solid"
                />
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-smooth"
                >
                  <Icon
                    name={isMuted || volume === 0 ? 'SpeakerXMarkIcon' : 'SpeakerWaveIcon'}
                    size={20}
                    className="text-white"
                  />
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Ovoz balandligi"
                  className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>

              <span className="text-white text-sm font-data tabular-nums">
                {formatTime(played)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Tezlik */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu((s) => !s)}
                  aria-label="Ijro tezligi"
                  className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-smooth text-white text-sm font-data"
                >
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-card rounded-md shadow-warm-lg overflow-hidden z-20">
                    {speeds.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          onSpeedChange(speed);
                          setShowSpeedMenu(false);
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left transition-smooth ${
                          speed === playbackSpeed
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                aria-label="To‘liq ekran"
                className="p-1.5 rounded-md hover:bg-white/10 transition-smooth"
              >
                <Icon
                  name={isFullscreen ? 'ArrowsPointingInIcon' : 'ArrowsPointingOutIcon'}
                  size={20}
                  className="text-white"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
