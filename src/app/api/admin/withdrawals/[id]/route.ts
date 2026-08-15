/**
 * PATCH /api/admin/withdrawals/[id]
 * Admin pul yechish so'rovini boshqaradi.
 * Body: { action: 'approve' | 'complete' | 'reject', adminNote?, rejectionReason? }
 *  - approve  → processing (pending'dan). Balansga ta'sir yo'q (hamon "pending" deduksiya).
 *  - complete → completed. "withdrawn"ga o'tadi (available o'zgarmaydi).
 *  - reject   → rejected. Mablag' teacher balansiga QAYTADI (rejectionReason majburiy).
 * Har qaror o'qituvchiga notifikatsiya yuboradi.
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const action = String(body.action || '');
    const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim() : null;
    const rejectionReason =
      typeof body.rejectionReason === 'string' ? body.rejectionReason.trim() : '';

    if (!['approve', 'complete', 'reject'].includes(action)) {
      throw new ValidationError('action: approve | complete | reject');
    }
    if (action === 'reject' && !rejectionReason) {
      return jsonResponse(
        { error: 'Rad etish sababi majburiy', code: 'REASON_REQUIRED' },
        { status: 400 },
      );
    }

    const w = await prisma.teacherWithdrawal.findUnique({ where: { id } });
    if (!w) {
      return jsonResponse({ error: 'So\'rov topilmadi', code: 'NOT_FOUND' }, { status: 404 });
    }

    // Holat o'tishlari
    const now = new Date();
    let data: Record<string, unknown>;
    let title: string;
    let message: string;
    const amount = w.amountUzs.toString();

    if (action === 'approve') {
      if (w.status !== 'pending') {
        return jsonResponse({ error: "Faqat 'pending' so'rovni tasdiqlash mumkin", code: 'INVALID_STATE' }, { status: 400 });
      }
      data = { status: 'processing', processedById: session.sub, processedAt: now, adminNote };
      title = 'Pul yechish so\'rovi tasdiqlandi';
      message = `${amount} so'm miqdoridagi so'rovingiz tasdiqlandi va to'lovga tayyorlanmoqda.`;
    } else if (action === 'complete') {
      if (w.status !== 'pending' && w.status !== 'processing') {
        return jsonResponse({ error: "Faqat pending/processing so'rovni yakunlash mumkin", code: 'INVALID_STATE' }, { status: 400 });
      }
      data = { status: 'completed', processedById: session.sub, processedAt: w.processedAt ?? now, completedAt: now, adminNote };
      title = 'Pul yechish yakunlandi ✅';
      message = `${amount} so'm hisobingizga o'tkazildi.`;
    } else {
      if (w.status !== 'pending' && w.status !== 'processing') {
        return jsonResponse({ error: "Faqat pending/processing so'rovni rad etish mumkin", code: 'INVALID_STATE' }, { status: 400 });
      }
      // rejected → mablag' balansga qaytadi (getBalance rejected'ni deduksiya qilmaydi)
      data = { status: 'rejected', processedById: session.sub, processedAt: now, rejectionReason, adminNote };
      title = 'Pul yechish so\'rovi rad etildi';
      message = `${amount} so'm so'rovingiz rad etildi. Sabab: ${rejectionReason}. Mablag' balansingizga qaytarildi.`;
    }

    const updated = await prisma.teacherWithdrawal.update({ where: { id }, data });

    // O'qituvchiga notifikatsiya (best-effort)
    try {
      await prisma.notification.create({
        data: {
          recipientId: w.teacherId,
          senderId: session.sub,
          type: 'payment',
          title,
          message,
          relatedEntityId: id,
        },
      });
    } catch (e) {
      console.error('[admin/withdrawals] notification failed:', e);
    }

    return jsonResponse({
      withdrawal: { ...updated, amountUzs: updated.amountUzs.toString() },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
