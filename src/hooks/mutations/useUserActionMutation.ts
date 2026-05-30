'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { AdminUserDTO } from '../queries/useAdminUsers';

export type UserActionMutationVars =
  | { userId: string; action: 'suspend'; reason?: string }
  | { userId: string; action: 'activate' }
  | { userId: string; action: 'change_role'; newRole: 'student' | 'teacher' | 'admin' };

type MutationVars = UserActionMutationVars;

async function patchUser(vars: MutationVars): Promise<{ user: AdminUserDTO }> {
  const { userId, ...body } = vars;
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Amal bajarilmadi (${res.status})`);
  }
  return json;
}

export function useUserActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchUser,
    onSuccess: () => {
      // Barcha admin-users sahifalari va statistika invalidate qilinadi
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}
