/**
 * Platforma "kun" hisoblash — O'zbekiston vaqti (Asia/Tashkent, UTC+5, DST yo'q).
 *
 * Faollik/streak/heatmap uchun "bugun" server UTC kaliti EMAS, foydalanuvchining
 * mahalliy (Toshkent) kalendar kuni bo'lishi kerak. Aks holda 00:00–05:00 (mahalliy)
 * oralig'ida o'qigan talaba faoliyati oldingi kunga tushib, streak noto'g'ri uziladi
 * va heatmap noto'g'ri katakni bo'yaydi.
 *
 * Yechim: kunni "yorliq" sifatida saqlaymiz — Toshkent kalendar Y-M-D ni UTC yarim
 * tunga (UTC-midnight) map qilamiz. Barcha saqlangan sana UTC-midnight bo'lgani uchun
 * kunlararo farq doim aniq 24 soat, ISO sana esa to'g'ri mahalliy kunni beradi.
 *
 * Sof Date arifmetikasi — server va client ikkalasida ham ishlaydi.
 */

// O'zbekiston 1992 yildan beri doimiy UTC+5 (yozgi vaqt yo'q).
export const TASHKENT_OFFSET_MIN = 5 * 60;

/**
 * Berilgan instant (default: hozir) uchun Toshkent kalendar kunini
 * UTC-midnight Date yorlig'i sifatida qaytaradi.
 */
export function platformDayLabel(instant: Date = new Date()): Date {
  const local = new Date(instant.getTime() + TASHKENT_OFFSET_MIN * 60_000);
  return new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()),
  );
}

/**
 * UTC-midnight sana yorlig'ini "YYYY-MM-DD" ga o'giradi (mahalliy kalendar kuni).
 */
export function platformDayIso(dayLabel: Date): string {
  return dayLabel.toISOString().split('T')[0];
}
