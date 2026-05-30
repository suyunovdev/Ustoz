'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { MaterialDTO, MaterialTypeDTO } from '../queries/useTopicMaterials';

export interface MaterialFormInput {
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  materialType: MaterialTypeDTO;
  storageType?: 'external' | 'r2';
  r2Key?: string | null;
}

async function postMaterial(vars: {
  topicId: string;
  input: MaterialFormInput;
}): Promise<{ material: MaterialDTO }> {
  const res = await fetch(`/api/teacher/topics/${vars.topicId}/materials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(vars.input),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Material qo'shilmadi (${res.status})`);
  return json;
}

async function patchMaterial(vars: {
  topicId: string;
  materialId: string;
  input: Partial<MaterialFormInput>;
}): Promise<{ material: MaterialDTO }> {
  const res = await fetch(
    `/api/teacher/topics/${vars.topicId}/materials/${vars.materialId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(vars.input),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Material yangilanmadi (${res.status})`);
  return json;
}

async function deleteMaterial(vars: {
  topicId: string;
  materialId: string;
}): Promise<void> {
  const res = await fetch(
    `/api/teacher/topics/${vars.topicId}/materials/${vars.materialId}`,
    { method: 'DELETE', credentials: 'include' },
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Material o'chirilmadi (${res.status})`);
  }
}

export function useAddMaterialMutation(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MaterialFormInput) => postMaterial({ topicId, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.topicMaterials(topicId) });
    },
  });
}

export function useUpdateMaterialMutation(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      materialId,
      input,
    }: {
      materialId: string;
      input: Partial<MaterialFormInput>;
    }) => patchMaterial({ topicId, materialId, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.topicMaterials(topicId) });
    },
  });
}

export function useDeleteMaterialMutation(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => deleteMaterial({ topicId, materialId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.topicMaterials(topicId) });
    },
  });
}

// ==================== MOVE / REPLACE ====================

export function useMoveMaterialMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      sourceTopicId: string;
      materialId: string;
      destinationTopicId: string;
    }) => {
      const res = await fetch(
        `/api/teacher/topics/${vars.sourceTopicId}/materials/${vars.materialId}/move`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ destinationTopicId: vars.destinationTopicId }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Material ko'chirilmadi (${res.status})`);
      return { sourceTopicId: vars.sourceTopicId, destinationTopicId: vars.destinationTopicId };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.topicMaterials(data.sourceTopicId) });
      qc.invalidateQueries({ queryKey: queryKeys.topicMaterials(data.destinationTopicId) });
    },
  });
}

export function useReplaceMaterialMutation(topicId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      materialId: string;
      newFileUrl: string;
      newFileName?: string;
      newMaterialType?: MaterialTypeDTO;
    }) => {
      const res = await fetch(
        `/api/teacher/topics/${topicId}/materials/${vars.materialId}/replace`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            newFileUrl: vars.newFileUrl,
            newFileName: vars.newFileName,
            newMaterialType: vars.newMaterialType,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Material almashtirilmadi (${res.status})`);
      return json as { material: MaterialDTO };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.topicMaterials(topicId) });
    },
  });
}
