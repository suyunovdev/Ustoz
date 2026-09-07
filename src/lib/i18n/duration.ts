/**
 * Davomiylikni (DAQIQA'da saqlanadi) o'qish uchun qulay matnga aylantiradi.
 * `Course.totalDuration` va topic'lar daqiqada — ilgari xato ravishda soat deb
 * ko'rsatilardi ("55 daqiqa" → "55 soat"). Bu yordamchi to'g'ri formatlaydi.
 */
type TFn = (key: string, params?: Record<string, string | number>) => string;

export function formatMinutes(minutes: number, t: TFn): string {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return t('student.durationMinutes', { count: m });
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem
    ? `${t('student.durationHours', { count: h })} ${t('student.durationMinutes', { count: rem })}`
    : t('student.durationHours', { count: h });
}
