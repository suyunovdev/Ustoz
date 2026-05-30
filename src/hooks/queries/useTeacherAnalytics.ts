'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface DailyPointDTO {
  date: string;
  revenue: string;
  enrollments: number;
  payments: number;
}

export interface GlobalAnalyticsDTO {
  range: number;
  dailyRevenue: DailyPointDTO[];
  comparison: {
    currentRevenue: string;
    previousRevenue: string;
    revenueDeltaPct: number | null;
    currentEnrollments: number;
    previousEnrollments: number;
    enrollmentsDeltaPct: number | null;
  };
  engagement: {
    totalMaterialViews: number;
    totalWatchHours: number;
    totalTopicCompletions: number;
    dailyActiveStudents: number;
    weeklyActiveStudents: number;
    monthlyActiveStudents: number;
  };
}

export interface CourseAnalyticsDTO {
  course: {
    courseId: string;
    courseTitle: string;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    avgProgress: number;
    totalRevenueUzs: string;
    totalRefundsUzs: string;
    reviewCount: number;
    avgRating: number;
  };
  topicFunnel: Array<{
    topicId: string;
    topicTitle: string;
    orderIndex: number;
    completions: number;
    completionRate: number;
  }>;
  topStudents: Array<{
    studentId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    progress: number;
    lastAccessedAt: string | null;
  }>;
  strugglingStudents: Array<{
    studentId: string;
    fullName: string;
    email: string;
    progress: number;
    lastAccessedAt: string | null;
    daysSinceActivity: number | null;
  }>;
  testStats: Array<{
    testId: string;
    testTitle: string;
    status: string;
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    avgScore: number;
  }>;
  assignmentStats: Array<{
    assignmentId: string;
    title: string;
    status: string;
    submissionCount: number;
    gradedCount: number;
    lateCount: number;
    avgGrade: number;
    gradeRate: number;
  }>;
}

export function useTeacherAnalytics(days: number) {
  return useQuery({
    queryKey: queryKeys.teacherAnalytics(days),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/analytics?days=${days}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Analytics yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<GlobalAnalyticsDTO>;
    },
    staleTime: 60_000,
  });
}

export function useCourseAnalytics(courseId: string | null) {
  return useQuery({
    queryKey: queryKeys.courseAnalytics(courseId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/courses/${courseId}/analytics`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Kurs analitikasi yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<CourseAnalyticsDTO>;
    },
    enabled: !!courseId,
    staleTime: 60_000,
  });
}
