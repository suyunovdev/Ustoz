/**
 * Student activity repository — student_activities jadvali uchun.
 * Streak hisoblash va heatmap manbai.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import { platformDayLabel } from '@/lib/date/platform-day';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

/**
 * Bugun uchun activity satrini upsert qiladi.
 * Kun — Toshkent (UTC+5) kalendar kuni, UTC-midnight yorlig'i sifatida
 * ({@link platformDayLabel}). `minutes` berilsa, minutesSpent ham inkrement qilinadi.
 */
export async function upsertForToday(
  studentId: string,
  tx?: Prisma.TransactionClient,
  minutes = 0,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  const today = platformDayLabel();
  const mins = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;

  await client.studentActivity.upsert({
    where: { studentId_date: { studentId, date: today } },
    create: {
      studentId,
      date: today,
      topicsCompleted: 1,
      minutesSpent: mins,
    },
    update: {
      topicsCompleted: { increment: 1 },
      ...(mins > 0 ? { minutesSpent: { increment: mins } } : {}),
    },
  });
}

/**
 * Faqat o'qish vaqtini (minutesSpent) qayd qiladi — topic tugatmasdan.
 * "touch"/heartbeat endpoint'idan chaqiriladi. topicsCompleted'ni oshirmaydi.
 */
export async function recordMinutes(
  studentId: string,
  minutes: number,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const mins = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
  if (mins === 0) return;
  const client: PrismaLike = tx ?? prisma;
  const today = platformDayLabel();

  await client.studentActivity.upsert({
    where: { studentId_date: { studentId, date: today } },
    create: { studentId, date: today, topicsCompleted: 0, minutesSpent: mins },
    update: { minutesSpent: { increment: mins } },
  });
}

/** Eng so'nggi N kun activity sanalarini olish (streak hisoblash uchun). */
export async function findRecentDates(
  studentId: string,
  limit = 365,
): Promise<Array<{ date: Date }>> {
  return prisma.studentActivity.findMany({
    where: { studentId },
    select: { date: true },
    orderBy: { date: 'desc' },
    take: limit,
  });
}

/** ASC tartibida (longest streak hisoblash uchun). */
export async function findRecentDatesAsc(
  studentId: string,
  limit = 365,
): Promise<Array<{ date: Date }>> {
  return prisma.studentActivity.findMany({
    where: { studentId },
    select: { date: true },
    orderBy: { date: 'asc' },
    take: limit,
  });
}

/** Heatmap uchun: ma'lum diapazonda activity satrlari. */
export async function findByDateRange(
  studentId: string,
  startDate: Date,
  endDate: Date,
): Promise<Array<{ date: Date; topicsCompleted: number; minutesSpent: number }>> {
  return prisma.studentActivity.findMany({
    where: {
      studentId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      date: true,
      topicsCompleted: true,
      minutesSpent: true,
    },
    orderBy: { date: 'asc' },
  });
}
