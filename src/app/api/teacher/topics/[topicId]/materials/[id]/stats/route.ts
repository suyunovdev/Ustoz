/**
 * GET /api/teacher/topics/[topicId]/materials/[id]/stats
 * Teacher uchun material statistikasi (total/unique/avg watch/last 7 days).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { contentMaterialRepo } from '@/lib/repositories';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;

    const material = await contentMaterialRepo.findById(id);
    if (!material) {
      return jsonResponse({ error: "Material topilmadi", code: 'MATERIAL_NOT_FOUND' }, { status: 404 });
    }
    if (material.teacherId !== session.sub && session.role !== 'admin') {
      return jsonResponse({ error: "Ruxsat yo'q", code: 'TOPIC_ACCESS_DENIED' }, { status: 403 });
    }

    const stats = await contentMaterialRepo.getViewStats(id);
    return jsonResponse({ stats });
  } catch (err) {
    return errorResponse(err);
  }
}
