/**
 * Markaziy query key factory.
 * Mutation'larda invalidate qilish uchun yagona manba.
 */

export const queryKeys = {
  studentDashboard: ['student-dashboard'] as const,
  streak: ['student-streak'] as const,
  activity: (days: number) => ['student-activity', days] as const,
  categories: ['categories'] as const,
  recommendations: (excludeKey: string) => ['recommendations', excludeKey] as const,
  courseProgress: (courseId: string) => ['course-progress', courseId] as const,
} as const;
