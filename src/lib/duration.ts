/**
 * Kurs mavzulari davomiyligini turli xil erkin formatlardan daqiqaga aylantirish
 * va o'zbekcha inson-o'qiydigan ko'rinishga formatlash.
 *
 * Qo'llab-quvvatlanadigan kirish formatlari:
 *   "10 min", "45 daqiqa", "1 soat", "1 soat 30 daqiqa",
 *   "1:30" (m:ss), "1:05:00" (h:mm:ss), "90", "" / "0 min"
 */

export function parseDurationToMinutes(raw: string | null | undefined): number {
  if (!raw || typeof raw !== 'string') return 0;
  const s = raw.trim().toLowerCase();
  if (!s || s === '—') return 0;

  // Ikki nuqtali format: m:ss yoki h:mm:ss
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => Number(p.trim()));
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
    if (parts.length === 2) return parts[0] + parts[1] / 60;
    return parts[0] || 0;
  }

  // So'z bilan: "1 soat 30 daqiqa", "45 daqiqa", "10 min", "2 h"
  let minutes = 0;
  let matched = false;
  const hourMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:soat|hour|hr|\bh\b)/);
  if (hourMatch) {
    minutes += parseFloat(hourMatch[1]) * 60;
    matched = true;
  }
  const minMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:daqiqa|daq|min|minute|\bm\b)/);
  if (minMatch) {
    minutes += parseFloat(minMatch[1]);
    matched = true;
  }
  if (matched) return minutes;

  // Faqat son — daqiqa deb qabul qilamiz
  const num = parseFloat(s);
  return Number.isNaN(num) ? 0 : num;
}

/** Daqiqalar yig'indisini o'zbekcha ko'rinishga: "2 soat 15 daqiqa" / "45 daqiqa". */
export function formatMinutes(totalMinutes: number): string {
  const m = Math.round(totalMinutes);
  if (m <= 0) return '—';
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (hours > 0 && mins > 0) return `${hours} soat ${mins} daqiqa`;
  if (hours > 0) return `${hours} soat`;
  return `${mins} daqiqa`;
}

/** Bir nechta erkin-format davomiyliklarni yig'ib, formatlab qaytaradi. */
export function sumDurations(durations: Array<string | null | undefined>): string {
  const total = durations.reduce((acc, d) => acc + parseDurationToMinutes(d), 0);
  return formatMinutes(total);
}
