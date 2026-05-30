'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type CertStatusDTO = 'active' | 'revoked';

export interface CertificateDTO {
  id: string;
  certificateNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  teacherName: string;
  finalGrade: number | null;
  completionPercent: number;
  status: CertStatusDTO;
  issueSource: string;
  issuedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  verificationUrl: string | null;
}

export function useTeacherCertificates(filters: {
  courseId?: string;
  status?: CertStatusDTO;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherCertificates(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.status) p.set('status', filters.status);
      if (filters.search) p.set('search', filters.search);
      const res = await fetch(`/api/teacher/certificates?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Sertifikatlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{
        rows: CertificateDTO[];
        nextCursor: string | null;
      }>;
    },
    staleTime: 30_000,
  });
}
