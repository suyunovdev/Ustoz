/**
 * Kurs tayyorligi (moderatsiyaga yuborish uchun) — YAGONA HAQIQAT MANBAI.
 *
 * Ayni qoidalar ikki joyda ishlatiladi:
 *   - Server: `POST /api/teacher/courses/[id]/submit` — chala kurs moderatsiyaga tushmaydi.
 *   - Klient: muharrirdagi "tayyorlik ro'yxati" — o'qituvchiga nima yetishmayotganini
 *     oldindan (submit'ni bosishdan oldin) aniq ko'rsatadi.
 *
 * Qoidalar: nom ≥3 belgi, tavsif ≥10 belgi, muqova rasmi mavjud, kamida bitta mavzu,
 * har mavzuda bo'sh bo'lmagan dars matni (content). TEST IXTIYORIY — bu yerda shart emas.
 */

export interface ReadinessTopicInput {
  content: string | null | undefined;
}

export interface ReadinessInput {
  title: string | null | undefined;
  description: string | null | undefined;
  coverImage: string | null | undefined;
  topics: ReadinessTopicInput[];
}

export type ReadinessKey = 'title' | 'description' | 'cover' | 'topics';

export interface ReadinessItem {
  key: ReadinessKey;
  done: boolean;
}

export interface CourseReadiness {
  items: ReadinessItem[];
  /** Kamida bitta mavzu bormi (0 mavzu — server'da alohida NO_TOPICS javobi). */
  hasTopics: boolean;
  /** Dars matni bo'sh mavzular soni. */
  emptyContentCount: number;
  /**
   * INCOMPLETE_COURSE javobi uchun yetishmovchiliklar (o'zbekcha, server matni bilan
   * AYNAN bir xil). "Kamida bitta mavzu" bu ro'yxatda EMAS — u alohida NO_TOPICS.
   */
  missing: string[];
  /** Barcha shartlar bajarildimi (submit yoqilishi mumkin). */
  complete: boolean;
}

const trimmed = (v: string | null | undefined): string => (typeof v === 'string' ? v.trim() : '');

export function getCourseReadiness(input: ReadinessInput): CourseReadiness {
  const titleOk = trimmed(input.title).length >= 3;
  const descriptionOk = trimmed(input.description).length >= 10;
  const coverOk = trimmed(input.coverImage).length > 0;

  const topics = Array.isArray(input.topics) ? input.topics : [];
  const hasTopics = topics.length > 0;
  const emptyContentCount = topics.filter((tp) => trimmed(tp.content).length === 0).length;
  const topicsOk = hasTopics && emptyContentCount === 0;

  const missing: string[] = [];
  if (!titleOk) missing.push('nom (kamida 3 belgi)');
  if (!descriptionOk) missing.push('tavsif (kamida 10 belgi)');
  if (!coverOk) missing.push('muqova rasmi');
  if (hasTopics && emptyContentCount > 0) {
    missing.push(`${emptyContentCount} ta mavzuda dars matni yo'q`);
  }

  const items: ReadinessItem[] = [
    { key: 'title', done: titleOk },
    { key: 'description', done: descriptionOk },
    { key: 'cover', done: coverOk },
    { key: 'topics', done: topicsOk },
  ];

  return {
    items,
    hasTopics,
    emptyContentCount,
    missing,
    complete: items.every((i) => i.done),
  };
}
