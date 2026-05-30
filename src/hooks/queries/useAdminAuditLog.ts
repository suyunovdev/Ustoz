'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface AuditLogEntryDTO {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: { id: string; fullName: string; email: string };
}

export interface AuditLogListResponse {
  logs: AuditLogEntryDTO[];
  total: number;
  nextCursor: string | null;
}

export interface AuditLogFilters {
  action?: string;
  targetType?: string;
  adminId?: string;
  search?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  cursor?: string | null;
  limit?: number;
}

async function fetchAuditLog(filters: AuditLogFilters): Promise<AuditLogListResponse> {
  const params = new URLSearchParams();
  if (filters.action) params.set('action', filters.action);
  if (filters.targetType) params.set('targetType', filters.targetType);
  if (filters.adminId) params.set('adminId', filters.adminId);
  if (filters.search) params.set('search', filters.search);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/audit-log?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Audit log yuklanmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminAuditLog(filters: AuditLogFilters = {}) {
  return useQuery<AuditLogListResponse, Error>({
    queryKey: queryKeys.adminAuditLogList({
      action: filters.action,
      targetType: filters.targetType,
      adminId: filters.adminId,
      search: filters.search,
      from: filters.from,
      to: filters.to,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchAuditLog(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

async function fetchMeta(): Promise<{ actions: string[]; targetTypes: string[] }> {
  const res = await fetch('/api/admin/audit-log/meta', { credentials: 'include' });
  if (!res.ok) throw new Error('Meta yuklanmadi');
  return res.json();
}

export function useAdminAuditLogMeta() {
  return useQuery({
    queryKey: queryKeys.adminAuditLogMeta,
    queryFn: fetchMeta,
    staleTime: 5 * 60_000, // 5 daqiqa cache
  });
}
