'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/** Talabalar ro'yxati sahifasi uchun bir sahifadagi talabalar soni. */
export const TEACHER_STUDENTS_PAGE_SIZE = 30;

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

interface TeacherStudentsPageDTO {
  students: TeacherStudentListItemDTO[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
}

/**
 * Talabalar ro'yxati sahifasi uchun paginatsiyalangan (infinite) variant —
 * "Ko'proq yuklash" bilan sahifama-sahifa. Jami sonni (`total`) ham qaytaradi,
 * shu sabab jimgina qirqim (ilgarigi LIMIT 500) yo'q. Picker'lar (guruh/sertifikat)
 * odatdagi `useTeacherStudents`ni ishlatadi — bu ularга tegmaydi.
 */
export function useTeacherStudentsInfinite(filters: {
  courseId?: string;
  search?: string;
  activeOnly?: boolean;
} = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.teacherStudentsPaged(filters),
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<TeacherStudentsPageDTO> => {
      const p = new URLSearchParams();
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.search) p.set('search', filters.search);
      if (filters.activeOnly) p.set('activeOnly', 'true');
      p.set('limit', String(TEACHER_STUDENTS_PAGE_SIZE));
      p.set('offset', String(pageParam));
      const res = await fetch(`/api/teacher/students?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Talabalar yuklanmadi (${res.status})`);
      }
      const data = (await res.json()) as {
        students: TeacherStudentListItemDTO[];
        total: number;
        hasMore: boolean;
      };
      return { ...data, nextOffset: pageParam + data.students.length };
    },
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : undefined),
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
