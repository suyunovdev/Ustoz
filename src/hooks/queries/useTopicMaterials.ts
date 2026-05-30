'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type MaterialTypeDTO =
  | 'video'
  | 'document'
  | 'audio'
  | 'image'
  | 'external_link';

export interface MaterialDTO {
  id: string;
  teacherId: string;
  courseId: string | null;
  topicId: string | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  fileType: string | null;
  materialType: MaterialTypeDTO;
  status: string;
  viewCount: number;
  storageType: string;
  r2Key: string | null;
  currentVersion: number;
  createdAt: string;
}

async function fetchMaterials(topicId: string): Promise<{ materials: MaterialDTO[] }> {
  const res = await fetch(`/api/teacher/topics/${topicId}/materials`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Materiallar yuklanmadi (${res.status})`);
  }
  return res.json();
}

export function useTopicMaterials(topicId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.topicMaterials(topicId ?? ''),
    queryFn: () => fetchMaterials(topicId!),
    enabled: !!topicId && enabled,
    staleTime: 60_000,
  });
}
