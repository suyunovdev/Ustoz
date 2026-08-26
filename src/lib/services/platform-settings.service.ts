/**
 * Platforma sozlamalari — admin boshqaradigan key-value.
 * Hozircha: obunachi kurs chegirmasi foizi.
 */
import { prisma } from '@/lib/prisma';

export const KEY_SUBSCRIBER_DISCOUNT = 'subscriber_course_discount_pct';

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Obunachi kurs chegirmasi (0–100). DB sozlamasidan o'qiladi; sozlanmagan bo'lsa
 * env (SUBSCRIBER_COURSE_DISCOUNT_PCT), u ham yo'q bo'lsa 0.
 */
export async function getSubscriberCourseDiscountSetting(): Promise<number> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: KEY_SUBSCRIBER_DISCOUNT } });
    if (row) return clampPct(Number(row.value));
  } catch {
    // jadval hali yo'q bo'lsa — env'ga tushamiz
  }
  return clampPct(Number(process.env.SUBSCRIBER_COURSE_DISCOUNT_PCT));
}

export async function setSubscriberCourseDiscountSetting(pct: number): Promise<number> {
  const value = String(clampPct(pct));
  await prisma.platformSetting.upsert({
    where: { key: KEY_SUBSCRIBER_DISCOUNT },
    create: { key: KEY_SUBSCRIBER_DISCOUNT, value },
    update: { value },
  });
  return Number(value);
}
