'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

/**
 * Muharrir uchun kurs metadatasi (muqova, tavsif, narx, daraja...). `/api/courses/[id]`
 * egaga to'liq kursni beradi (`...course` spread) — bu yerda faqat muharrirga kerakli
 * maydonlarni olamiz. `teacherCourse(id)` kaliti bilan — PATCH'dan keyin invalidatsiya
 * qilinsa tayyorlik ro'yxati o'z-o'zidan yangilanadi.
 */
export interface TeacherCourseDetail {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  priceUzs: string;
  language: string | null;
  difficultyLevel: string | null;
  category: string | null;
  targetAudience: string | null;
  subjectCategory: string | null;
  gradeLevel: number | null;
  moderationStatus: string;
}

async function fetchCourseDetail(courseId: string): Promise<TeacherCourseDetail> {
  const res = await fetch(`/api/courses/${courseId}`, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.course) {
    throw new Error(json.error || `Kurs yuklanmadi (${res.status})`);
  }
  const c = json.course;
  return {
    id: c.id,
    title: c.title ?? '',
    description: c.description ?? null,
    coverImage: c.coverImage ?? null,
    priceUzs: typeof c.priceUzs === 'string' ? c.priceUzs : String(c.priceUzs ?? '0'),
    language: c.language ?? null,
    difficultyLevel: c.difficultyLevel ?? null,
    category: c.category ?? null,
    targetAudience: c.targetAudience ?? null,
    subjectCategory: c.subjectCategory ?? null,
    gradeLevel: typeof c.gradeLevel === 'number' ? c.gradeLevel : null,
    moderationStatus: c.moderationStatus ?? 'draft',
  };
}

export function useTeacherCourseDetail(courseId: string) {
  return useQuery({
    queryKey: queryKeys.teacherCourse(courseId),
    queryFn: () => fetchCourseDetail(courseId),
    staleTime: 30_000,
  });
}
