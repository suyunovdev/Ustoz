/**
 * GET  /api/admin/settings — joriy platforma sozlamalari (maxfiy kalitlar maskalangan)
 * PATCH /api/admin/settings — sozlamalarni yangilash
 *
 * Faqat admin. Bunny Stream kalitlari (Library ID, API Key, Token Key) va
 * obunachi chegirmasi UI'dan boshqariladi. Maxfiy kalitlar javobda to'liq
 * ko'rsatilmaydi; PATCH'da bo'sh qoldirilsa eski qiymat saqlanib qoladi.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getBunnyConfig,
  setBunnySettings,
  getSubscriberCourseDiscountSetting,
  setSubscriberCourseDiscountSetting,
} from '@/lib/services/platform-settings.service';
import { log, AUDIT_ACTIONS } from '@/lib/services/audit-log.service';

function mask(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 4) return '••••';
  return '••••' + secret.slice(-4);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const cfg = await getBunnyConfig();
    const subscriberDiscountPct = await getSubscriberCourseDiscountSetting();
    return jsonResponse({
      bunny: {
        libraryId: cfg.libraryId,
        apiKeySet: !!cfg.apiKey,
        apiKeyMasked: mask(cfg.apiKey),
        tokenKeySet: !!cfg.tokenKey,
        configured: !!(cfg.libraryId && cfg.apiKey),
      },
      subscriberDiscountPct,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "Noto'g'ri so'rov tanasi" }, { status: 400 });
    }

    const changed: string[] = [];
    const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

    const bunnyLibraryId = str(body.bunnyLibraryId);
    const bunnyApiKey = str(body.bunnyApiKey);
    const bunnyTokenKey = str(body.bunnyTokenKey);

    if (bunnyLibraryId?.trim()) changed.push('bunnyLibraryId');
    if (bunnyApiKey?.trim()) changed.push('bunnyApiKey');
    if (bunnyTokenKey?.trim()) changed.push('bunnyTokenKey');

    await setBunnySettings({
      libraryId: bunnyLibraryId,
      apiKey: bunnyApiKey,
      tokenKey: bunnyTokenKey,
    });

    if (body.subscriberDiscountPct !== undefined && body.subscriberDiscountPct !== null) {
      const pct = Number(body.subscriberDiscountPct);
      if (Number.isFinite(pct)) {
        await setSubscriberCourseDiscountSetting(pct);
        changed.push('subscriberDiscountPct');
      }
    }

    // Audit — maxfiy qiymatlar EMAS, faqat qaysi maydonlar o'zgargani.
    await log({
      adminId: admin.sub,
      action: AUDIT_ACTIONS.SETTINGS_UPDATE,
      targetType: 'settings',
      metadata: { changed },
      request: req,
    }).catch(() => { /* audit best-effort */ });

    return jsonResponse({ ok: true, changed });
  } catch (err) {
    return errorResponse(err);
  }
}
