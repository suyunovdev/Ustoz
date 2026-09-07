'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface ProfileDTO {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  interests: string[];
  headline: string | null;
  expertise: string[];
  socialLinks: Record<string, string>;
  notificationPrefs: Record<string, boolean>;
  deletionRequestedAt: string | null;
  deletionReason: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ProfileOverviewDTO {
  role: string;
  stats: {
    // student
    enrolled?: number;
    completed?: number;
    certificates?: number;
    streak?: number;
    // teacher
    courses?: number;
    students?: number;
    avgRating?: number;
    revenueUzs?: string;
  };
}

export function useProfileOverview() {
  return useQuery({
    queryKey: ['profile', 'overview'] as const,
    queryFn: async () => {
      const res = await fetch('/api/profile/overview', { credentials: 'include' });
      if (!res.ok) throw new Error(`Statistika yuklanmadi (${res.status})`);
      return res.json() as Promise<ProfileOverviewDTO>;
    },
    staleTime: 60_000,
  });
}

export interface PublicTeacherDTO {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  expertise: string[];
  socialLinks: Record<string, string>;
  joinedAt: string;
  totalCourses: number;
  totalStudents: number;
  avgRating: number;
  totalReviews: number;
}

export interface PublicTeacherCourseDTO {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  priceUzs: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  language: string;
  createdAt: string;
}

export function useMyProfile() {
  return useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Profil yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ profile: ProfileDTO }>;
    },
    staleTime: 60_000,
  });
}

export function usePublicTeacher(teacherId: string | null) {
  return useQuery({
    queryKey: queryKeys.publicTeacher(teacherId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${teacherId}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Teacher yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ teacher: PublicTeacherDTO }>;
    },
    enabled: !!teacherId,
    staleTime: 60_000,
  });
}

export function usePublicTeacherCourses(teacherId: string | null) {
  return useQuery({
    queryKey: queryKeys.publicTeacherCourses(teacherId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teachers/${teacherId}/courses`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Kurslar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ courses: PublicTeacherCourseDTO[] }>;
    },
    enabled: !!teacherId,
    staleTime: 60_000,
  });
}
