'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="uz-nf relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      {/* Dekorativ fon: yumshoq pulslanuvchi nur + suzuvchi zarralar */}
      <div className="uz-nf-glow" aria-hidden="true" />
      <div className="uz-nf-particles" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`uz-nf-dot uz-nf-dot-${i + 1}`} />
        ))}
      </div>

      <div className="uz-nf-content relative z-10 text-center max-w-lg">
        {/* 404 — o'rtadagi "0" o'rniga jonlanadigan Ustoz logotipi (bilim qatlamlari) */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 select-none" aria-label="404">
          <span className="uz-nf-digit">4</span>

          <span className="uz-nf-mark" role="img" aria-hidden="true">
            <span className="uz-nf-mark-glow" />
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="uz-nf-logo">
              <path className="uz-nf-layer uz-nf-layer-top" d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
              <path className="uz-nf-layer uz-nf-layer-mid" d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path className="uz-nf-layer uz-nf-layer-bot" d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>

          <span className="uz-nf-digit">4</span>
        </div>

        <h1 className="mt-8 text-2xl sm:text-3xl font-heading font-bold text-foreground">
          {t('ui.notFoundTitle')}
        </h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          {t('ui.notFoundDesc')}
        </p>

        <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="uz-nf-btn inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium shadow-warm hover:opacity-90 transition-all duration-200"
          >
            <Icon name="HomeIcon" size={18} />
            {t('ui.goHome')}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="uz-nf-btn inline-flex items-center justify-center gap-2 bg-muted text-foreground px-6 py-3 rounded-md font-medium hover:bg-muted/70 transition-all duration-200"
          >
            <Icon name="ArrowLeftIcon" size={18} />
            {t('common.back')}
          </button>
        </div>

        {/* Brend */}
        <div className="mt-12 flex items-center justify-center gap-2 opacity-70">
          <span className="flex items-center justify-center w-6 h-6 bg-primary rounded-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-primary-foreground" />
              <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-primary-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-heading font-bold text-foreground">Ustoz</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .uz-nf-content {
          animation: uz-nf-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* 404 raqamlari — brand gradient (ko'k → oltin) + yumshoq porlash */
        .uz-nf-digit {
          font-family: var(--font-heading, inherit);
          font-weight: 800;
          font-size: clamp(5.5rem, 22vw, 11rem);
          line-height: 1;
          background: linear-gradient(
            135deg,
            var(--color-primary) 0%,
            var(--color-accent) 55%,
            var(--color-primary) 100%
          );
          background-size: 200% 200%;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
          animation: uz-nf-shimmer 6s ease-in-out infinite;
        }

        /* O'rtadagi logo — suzadi */
        .uz-nf-mark {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: clamp(4.2rem, 17vw, 8.5rem);
          height: clamp(4.2rem, 17vw, 8.5rem);
          animation: uz-nf-float 4.5s ease-in-out infinite;
        }
        .uz-nf-mark-glow {
          position: absolute;
          inset: -18%;
          border-radius: 9999px;
          background: radial-gradient(circle, var(--color-primary) 0%, transparent 68%);
          opacity: 0.18;
          filter: blur(14px);
          animation: uz-nf-pulse 4.5s ease-in-out infinite;
        }
        .uz-nf-logo {
          width: 100%;
          height: 100%;
          color: var(--color-primary);
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.12));
        }
        /* Qatlamlar bir-biridan mustaqil, nozik nafas oladi */
        .uz-nf-layer {
          transform-box: fill-box;
          transform-origin: center;
        }
        .uz-nf-layer-top { animation: uz-nf-layer 4.5s ease-in-out infinite; }
        .uz-nf-layer-mid { animation: uz-nf-layer 4.5s ease-in-out infinite 0.22s; color: var(--color-accent); }
        .uz-nf-layer-bot { animation: uz-nf-layer 4.5s ease-in-out infinite 0.44s; }

        /* Fon nuri */
        .uz-nf-glow {
          position: absolute;
          top: 42%;
          left: 50%;
          width: min(70vw, 620px);
          height: min(70vw, 620px);
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          background: radial-gradient(circle, var(--color-primary) 0%, transparent 62%);
          opacity: 0.1;
          filter: blur(40px);
          animation: uz-nf-pulse 7s ease-in-out infinite;
          pointer-events: none;
        }

        /* Suzuvchi zarralar */
        .uz-nf-particles { position: absolute; inset: 0; pointer-events: none; }
        .uz-nf-dot {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: var(--color-primary);
          opacity: 0;
          animation: uz-nf-drift 9s linear infinite;
        }
        .uz-nf-dot-1 { left: 14%; bottom: -10px; animation-delay: 0s; }
        .uz-nf-dot-2 { left: 32%; bottom: -10px; width: 6px; height: 6px; background: var(--color-accent); animation-delay: 1.6s; }
        .uz-nf-dot-3 { left: 51%; bottom: -10px; animation-delay: 3.1s; }
        .uz-nf-dot-4 { left: 68%; bottom: -10px; width: 5px; height: 5px; background: var(--color-accent); animation-delay: 4.4s; }
        .uz-nf-dot-5 { left: 83%; bottom: -10px; animation-delay: 2.3s; }
        .uz-nf-dot-6 { left: 44%; bottom: -10px; width: 10px; height: 10px; animation-delay: 6s; }

        .uz-nf-btn:hover { transform: translateY(-2px); }
        .uz-nf-btn:active { transform: translateY(0); }

        @keyframes uz-nf-in {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes uz-nf-shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes uz-nf-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes uz-nf-layer {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes uz-nf-pulse {
          0%, 100% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes uz-nf-drift {
          0% { opacity: 0; transform: translateY(0) scale(0.6); }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-90vh) scale(1); }
        }

        /* Harakat kamaytirilsin (foydalanuvchi sozlamasi) */
        @media (prefers-reduced-motion: reduce) {
          .uz-nf-content,
          .uz-nf-digit,
          .uz-nf-mark,
          .uz-nf-mark-glow,
          .uz-nf-layer,
          .uz-nf-glow,
          .uz-nf-dot { animation: none !important; }
          .uz-nf-dot { display: none; }
        }
      ` }} />
    </div>
  );
}
