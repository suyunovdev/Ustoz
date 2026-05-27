/**
 * Student activity repository — student_activities jadvali uchun.
 * Streak hisoblash va heatmap manbai.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

/** Bugun uchun activity satrini upsert qiladi (UTC sana). */
export async function upsertForToday(
  studentId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await client.studentActivity.upsert({
    where: { studentId_date: { studentId, date: today } },
    create: {
      studentId,
      date: today,
      topicsCompleted: 1,
      minutesSpent: 0,
    },
    update: {
      topicsCompleted: { increment: 1 },
    },
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
