'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface AdminUserBase {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  headline: string | null;
  referralCode: string | null;
  isActive: boolean;
  deletedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminTeacherCourse {
  id: string;
  title: string;
  moderationStatus: string;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  topicCount: number;
  revenueUzs: string;
}

export interface AdminTeacherDetail {
  stats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    underReviewCourses: number;
    rejectedCourses: number;
    totalEnrollments: number;
    totalRevenueUzs: string;
    platformFeePct: number;
    avgRating: number;
  };
  courses: AdminTeacherCourse[];
  balance: {
    grossRevenueUzs: string;
    refundedUzs: string;
    platformFeePct: number;
    platformFeeUzs: string;
    netRevenueUzs: string;
    withdrawnUzs: string;
    pendingWithdrawalUzs: string;
    availableUzs: string;
    completedPaymentCount: number;
    refundedPaymentCount: number;
  };
  payout: {
    bankName: string | null;
    recipientName: string | null;
    cardNumber: string | null;
    accountNumber: string | null;
    hasPayout: boolean;
  };
  application: {
    status: string;
    expertise: string;
    createdAt: string;
    feedback: string | null;
  } | null;
}

export interface AdminStudentEnrollment {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  completedAt: string | null;
  isActive: boolean;
  lastAccessedAt: string | null;
}

export interface AdminStudentDetail {
  enrollments: AdminStudentEnrollment[];
  stats: {
    totalTopicCompletions: number;
    totalTestAttempts: number;
    passedTestAttempts: number;
    avgTestScore: number | null;
    totalAssignmentSubmissions: number;
    gradedAssignmentSubmissions: number;
    avgAssignmentGrade: number | null;
    totalCertificates: number;
    totalPaymentsUzs: string;
  } | null;
}

export interface AdminUserDetail {
  user: AdminUserBase;
  teacher?: AdminTeacherDetail;
  student?: AdminStudentDetail;
}

async function fetchUserDetail(id: string): Promise<AdminUserDetail> {
  const res = await fetch(`/api/admin/users/${id}`, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Yuklanmadi (${res.status})`);
  return json as AdminUserDetail;
}

export function useAdminUserDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.adminUser(id),
    queryFn: () => fetchUserDetail(id),
    staleTime: 30_000,
  });
}
