/**
 * GET /api/admin/subscription-discount  → { discountPct }
 * PUT /api/admin/subscription-discount  → body { discountPct: 0..100 }
 *
 * Obunachi kurs chegirmasi foizini admin boshqaradi (env o'rniga DB).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  getSubscriberCourseDiscountSetting,
  setSubscriberCourseDiscountSetting,
} from '@/lib/services/platform-settings.service';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const discountPct = await getSubscriberCourseDiscountSetting();
    return jsonResponse({ discountPct });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const raw = Number(body.discountPct);
    if (!Number.isFinite(raw) || raw < 0 || raw > 100) {
      throw new ValidationError('discountPct 0 va 100 orasida bo\'lishi kerak');
    }
    const discountPct = await setSubscriberCourseDiscountSetting(raw);
    return jsonResponse({ discountPct });
  } catch (err) {
    return errorResponse(err);
  }
}
