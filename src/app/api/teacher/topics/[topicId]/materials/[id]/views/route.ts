/**
 * POST /api/teacher/topics/[topicId]/materials/[id]/views
 *
 * Material ko'rilganini yozish (talaba video/PDF ochganda).
 * Auth — har qanday authenticated user (talaba ham yoza oladi).
 * Anonim foydalanuvchilar uchun studentId=null bo'ladi (ipAddress saqlanadi).
 *
 * Body (ixtiyoriy): { watchSec: number }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse, getClientIp } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { contentMaterialRepo } from '@/lib/repositories';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const material = await contentMaterialRepo.findById(id);
    if (!material) {
      return jsonResponse({ error: "Material topilmadi", code: 'MATERIAL_NOT_FOUND' }, { status: 404 });
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const watchSec =
      body && typeof body === 'object' && typeof (body as Record<string, unknown>).watchSec === 'number'
        ? Math.min(Math.max(Math.floor((body as Record<string, unknown>).watchSec as number), 0), 86400)
        : null;

    await contentMaterialRepo.recordView({
      materialId: id,
      studentId: session.sub,
      watchSec,
      ipAddress: getClientIp(req),
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
