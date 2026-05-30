'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface CourseTopicDTO {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  orderIndex: number;
  duration: string;
  content: string;
  hasQuiz: boolean;
  isFreePreview: boolean;
  isLocked: boolean;
  moduleTitle: string | null;
  createdAt: string;
}

async function fetchTopics(courseId: string): Promise<{ topics: CourseTopicDTO[] }> {
  const res = await fetch(`/api/teacher/courses/${courseId}/topics`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Mavzular yuklanmadi (${res.status})`);
  }
  return res.json();
}

export function useCourseTopics(courseId: string | null) {
  return useQuery({
    queryKey: queryKeys.teacherCourseTopics(courseId ?? ''),
    queryFn: () => fetchTopics(courseId!),
    enabled: !!courseId,
    staleTime: 30_000,
  });
}
