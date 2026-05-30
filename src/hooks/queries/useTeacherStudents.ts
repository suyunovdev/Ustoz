'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface TeacherStudentListItemDTO {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  enrolledCourses: number;
  activeEnrollments: number;
  completedCourses: number;
  avgProgress: number;
  lastActivityAt: string | null;
  firstEnrolledAt: string;
  totalPayments: string;
}

export interface StudentEnrollmentDTO {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
  progress: number;
  completedAt: string | null;
  isActive: boolean;
  lastAccessedAt: string | null;
}

export interface StudentDetailDTO {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
  enrollments: StudentEnrollmentDTO[];
  totalTopicCompletions: number;
  totalTestAttempts: number;
  passedTestAttempts: number;
  avgTestScore: number | null;
  totalAssignmentSubmissions: number;
  gradedAssignmentSubmissions: number;
  avgAssignmentGrade: number | null;
  totalCertificates: number;
  totalPaymentsUzs: string;
}

export function useTeacherStudents(filters: {
  courseId?: string;
  search?: string;
  activeOnly?: boolean;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherStudents(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.search) p.set('search', filters.search);
      if (filters.activeOnly) p.set('activeOnly', 'true');
      const res = await fetch(`/api/teacher/students?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Talabalar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ students: TeacherStudentListItemDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function useStudentDetail(studentId: string | null) {
  return useQuery({
    queryKey: queryKeys.teacherStudent(studentId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/students/${studentId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Talaba yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ student: StudentDetailDTO }>;
    },
    enabled: !!studentId,
    staleTime: 15_000,
  });
}
