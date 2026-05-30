/**
 * GET   /api/notifications?status=&type=&cursor=&limit=
 * PATCH /api/notifications — legacy: { ids?, markAll? }
 * DELETE /api/notifications?id=  — legacy
 *
 * Yangi route'lar:
 *   POST   /api/notifications/[id]/read     — bitta read
 *   POST   /api/notifications/[id]/archive  — bitta archive
 *   POST   /api/notifications/read-all      — barchasi
 *   GET    /api/notifications/badge         — faqat unread count
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getInbox,
  markMultipleRead,
  markAllRead,
  deleteOne,
} from '@/lib/services/notification.service';
import { ValidationError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const type = searchParams.get('type') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(Number(limitParam), 100) : undefined;
    // Legacy: unread=true → status=unread
    const unreadOnly = searchParams.get('unread') === 'true';
    const effectiveStatus = unreadOnly ? 'unread' : status;

    const result = await getInbox(session.sub, {
      status: effectiveStatus,
      type,
      cursor,
      limit,
    });

    return jsonResponse({
      rows: result.rows,
      nextCursor: result.nextCursor,
      unreadCount: result.unreadCount,
      countsByType: result.countsByType,
      // Legacy field — eski NotificationBell uchun
      notifications: result.rows,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

// Legacy bulk operations
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    if (b.markAll === true) {
      const result = await markAllRead(session.sub);
      return jsonResponse({ success: true, updated: result.updated });
    }
    if (Array.isArray(b.ids) && b.ids.every((x) => typeof x === 'string')) {
      const result = await markMultipleRead(b.ids as string[], session.sub);
      return jsonResponse({ success: true, updated: result.updated });
    }
    throw new ValidationError("ids[] yoki markAll:true kerak");
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) throw new ValidationError("id majburiy");
    await deleteOne(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
