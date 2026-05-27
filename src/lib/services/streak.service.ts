/**
 * Streak Service
 * --------------
 * `student_activities` dan kunlik faollik ketma-ketligini hisoblaydi.
 * Data layer: activity.repository orqali.
 */

import { activityRepo } from '@/lib/repositories';
import type { ActivityRecord, StreakData } from '@/types/activity.types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS_WINDOW = 365;

// ─── Private helpers ──────────────────────────────────────────────────────

function normalizeToUtcDate(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function toIsoDateString(d: Date): string {
  return normalizeToUtcDate(d).toISOString().split('T')[0];
}

function calculateCurrentFromList(
  activitiesDesc: Array<{ date: Date }>,
  today: Date,
): number {
  if (activitiesDesc.length === 0) return 0;

  const todayTime = today.getTime();
  const mostRecent = normalizeToUtcDate(activitiesDesc[0].date);
  const diffDays = Math.round((todayTime - mostRecent.getTime()) / ONE_DAY_MS);

  if (diffDays > 1) return 0;

  let streak = 1;
  let expectedTime = mostRecent.getTime();

  for (let i = 1; i < activitiesDesc.length; i++) {
    expectedTime -= ONE_DAY_MS;
    const currentTime = normalizeToUtcDate(activitiesDesc[i].date).getTime();

    if (currentTime === expectedTime) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestFromList(activities: Array<{ date: Date }>): number {
  if (activities.length === 0) return 0;
  if (activities.length === 1) return 1;

  const times = activities
    .map((a) => normalizeToUtcDate(a.date).getTime())
    .sort((a, b) => a - b);

  let longest = 1;
  let current = 1;

  for (let i = 1; i < times.length; i++) {
    const diffDays = Math.round((times[i] - times[i - 1]) / ONE_DAY_MS);
    if (diffDays === 1) {
      current++;
      if (current > longest) longest = current;
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return longest;
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getCurrentStreak(studentId: string): Promise<number> {
  const activities = await activityRepo.findRecentDates(studentId, MAX_DAYS_WINDOW);
  return calculateCurrentFromList(activities, normalizeToUtcDate(new Date()));
}

export async function getLongestStreak(studentId: string): Promise<number> {
  const activities = await activityRepo.findRecentDatesAsc(studentId, MAX_DAYS_WINDOW);
  return calculateLongestFromList(activities);
}

/**
 * Bitta query bilan barcha streak ma'lumoti.
 * Performance: 1 DB query (take: 365) + O(n) memory.
 */
export async function getStreakData(studentId: string): Promise<StreakData> {
  const activities = await activityRepo.findRecentDates(studentId, MAX_DAYS_WINDOW);

  if (activities.length === 0) {
    return {
      current: 0,
      longest: 0,
      lastActivityDate: null,
      activeToday: false,
    };
  }

  const today = normalizeToUtcDate(new Date());
  const mostRecent = normalizeToUtcDate(activities[0].date);

  return {
    current: calculateCurrentFromList(activities, today),
    longest: calculateLongestFromList(activities),
    lastActivityDate: toIsoDateString(mostRecent),
    activeToday: mostRecent.getTime() === today.getTime(),
  };
}

/**
 * Heatmap uchun: oxirgi N kun activity kalendari.
 */
export async function getActivityCalendar(
  studentId: string,
  days = 90,
): Promise<ActivityRecord[]> {
  const endDate = normalizeToUtcDate(new Date());
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - days);

  const activities = await activityRepo.findByDateRange(studentId, startDate, endDate);

  return activities.map((a) => ({
    date: toIsoDateString(a.date),
    topicsCompleted: a.topicsCompleted,
    minutesSpent: a.minutesSpent,
  }));
}
