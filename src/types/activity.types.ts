/**
 * Activity & Streak type'lari
 *
 * Manba: src/lib/services/progress.service.ts — `markTopicComplete` da
 *        StudentActivity upsert qilinadi.
 *
 * Kelajak (HAFTA 2):
 *  - GET /api/student/streak        → StreakData
 *  - GET /api/student/activity      → ActivityRecord[]  (heatmap uchun, 365 kun)
 */

/** Bitta kunlik agregat (DB satr → API response) */
export interface ActivityRecord {
  /** ISO sana (yyyy-mm-dd), vaqtsiz */
  date: string;
  topicsCompleted: number;
  minutesSpent: number;
}

/** Streak hisobi — Dashboard WelcomeSection uchun */
export interface StreakData {
  /** Hozirgi ketma-ket kunlar (bugun activity bo'lsa hisoblanadi) */
  current: number;
  /** All-time eng uzun streak */
  longest: number;
  /** ISO sana yoki null (hali activity yo'q) */
  lastActivityDate: string | null;
  /** Bugun activity bormi (UTC) */
  activeToday: boolean;
}
