'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type ModerationStatusDTO =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export interface TeacherDashboardCourse {
  id: string;
  title: string;
  coverImage: string | null;
  isPublished: boolean;
  moderationStatus: ModerationStatusDTO;
  adminFeedback: string | null;
  priceUzs: string;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  topicCount: number;
  revenueUzs: string;
  createdAt: string;
}

export interface TeacherDashboardData {
  courses: TeacherDashboardCourse[];
  stats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    underReviewCourses: number;
    rejectedCourses: number;
    totalEnrollments: number;
    totalRevenueUzs: string;
    avgRating: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: string; enrollments: number }>;
  recentTransactions: Array<{
    id: string;
    studentName: string;
    courseTitle: string;
    amountUzs: string;
    createdAt: string;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    enrollmentCount: number;
    revenueUzs: string;
    rating: number;
  }>;
  needsAttention: Array<{
    type: 'rejected' | 'revision_requested' | 'pending_review';
    courseId: string;
    courseTitle: string;
    feedback: string | null;
  }>;
}

async function fetchDashboard(): Promise<TeacherDashboardData> {
  const res = await fetch('/api/teacher/dashboard', { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Dashboard yuklanmadi (${res.status})`);
  }
  return res.json();
}

export function useTeacherDashboard() {
  return useQuery<TeacherDashboardData, Error>({
    queryKey: queryKeys.teacherDashboard,
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });
}
