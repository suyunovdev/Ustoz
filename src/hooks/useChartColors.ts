'use client';

/**
 * useChartColors — grafik (Recharts) ranglarini CSS o'zgaruvchilaridan o'qiydi,
 * shunda dark mode'da avtomatik moslashadi (ilgari hardcoded hex edi → dark'da
 * o'q matni ko'rinmas, tooltip oq quti bo'lardi).
 */
import { useEffect, useState } from 'react';

export interface ChartColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  destructive: string;
  axis: string;
  grid: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

const FALLBACK: ChartColors = {
  primary: '#0F4C75', secondary: '#3282B8', success: '#38A169',
  warning: '#D69E2E', destructive: '#E53E3E', axis: '#4A5568',
  grid: 'rgba(15,76,117,0.12)', tooltipBg: '#FFFFFF',
  tooltipBorder: 'rgba(15,76,117,0.12)', tooltipText: '#2D3748',
};

function read(): ChartColors {
  if (typeof window === 'undefined') return FALLBACK;
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => (s.getPropertyValue(name).trim() || fb);
  return {
    primary: v('--color-primary', FALLBACK.primary),
    secondary: v('--color-secondary', FALLBACK.secondary),
    success: v('--color-success', FALLBACK.success),
    warning: v('--color-warning', FALLBACK.warning),
    destructive: v('--color-destructive', FALLBACK.destructive),
    axis: v('--color-muted-foreground', FALLBACK.axis),
    grid: v('--color-border', FALLBACK.grid),
    tooltipBg: v('--color-card', FALLBACK.tooltipBg),
    tooltipBorder: v('--color-border', FALLBACK.tooltipBorder),
    tooltipText: v('--color-card-foreground', FALLBACK.tooltipText),
  };
}

export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(FALLBACK);
  useEffect(() => {
    setColors(read());
    // Tema o'zgarganda (.dark klass) qayta o'qish
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return colors;
}
