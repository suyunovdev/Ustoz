/**
 * Dashboard Progress Helper
 * -------------------------
 * Bir nechta enrollment uchun progress meta'ni N+1 query'siz hisoblaydi.
 *
 * Naive (yomon):
 *   enrollments.map(e => getNextTopic(student, e.courseId))  // N+1
 *
 * Bu helper (yaxshi):
 *   1 ta query barcha topiclar uchun (where courseId IN ids)
 *   1 ta query barcha completionlar uchun (where courseId IN ids, studentId=X)
 *   Memory'da group by courseId
 *
 * Result: Map<courseId, { nextTopic, completedTopicsCount, totalTopics }>
 */

import { topicRepo, topicCompletionRepo } from '@/lib/repositories';

export interface EnrollmentProgressMeta {
  nextTopic: { id: string; title: string; orderIndex: number } | null;
  completedTopicsCount: number;
  totalTopics: number;
}

/**
 * @param studentId   user_profiles.id (= users.id)
 * @param enrollments — eng kamida { courseId: string } bo'lishi kerak
 */
export async function computeProgressForEnrollments(
  studentId: string,
  enrollments: Array<{ courseId: string }>,
): Promise<Map<string, EnrollmentProgressMeta>> {
  const result = new Map<string, EnrollmentProgressMeta>();
  if (enrollments.length === 0) return result;

  // dedupe (extra ehtiyot)
  const courseIds = Array.from(new Set(enrollments.map((e) => e.courseId)));

  // 2 ta parallel query — N'ga bog'liq emas (repository orqali)
  const [topics, completions] = await Promise.all([
    topicRepo.findByCourses(courseIds),
    topicCompletionRepo.findByStudentAndCourses(studentId, courseIds),
  ]);

  // Group: courseId → Set<completed topicId>
  const completedByCourse = new Map<string, Set<string>>();
  for (const c of completions) {
    let set = completedByCourse.get(c.courseId);
    if (!set) {
      set = new Set<string>();
      completedByCourse.set(c.courseId, set);
    }
    set.add(c.topicId);
  }

  // Group: courseId → Topic[] (allaqachon orderIndex ASC)
  type TopicRow = { id: string; title: string; orderIndex: number; courseId: string };
  const topicsByCourse = new Map<string, TopicRow[]>();
  for (const t of topics) {
    let arr = topicsByCourse.get(t.courseId);
    if (!arr) {
      arr = [];
      topicsByCourse.set(t.courseId, arr);
    }
    arr.push(t);
  }

  // Compute per course
  for (const courseId of courseIds) {
    const courseTopics = topicsByCourse.get(courseId) ?? [];
    const completedSet = completedByCourse.get(courseId) ?? new Set<string>();
    const next = courseTopics.find((t) => !completedSet.has(t.id)) ?? null;

    result.set(courseId, {
      nextTopic: next
        ? { id: next.id, title: next.title, orderIndex: next.orderIndex }
        : null,
      completedTopicsCount: completedSet.size,
      totalTopics: courseTopics.length,
    });
  }

  return result;
}
