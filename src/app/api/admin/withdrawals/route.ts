/**
 * GET /api/admin/withdrawals?status=pending|processing|completed|rejected|all
 * Admin uchun o'qituvchi pul yechish so'rovlari ro'yxati (default: pending).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

const VALID = new Set(['pending', 'processing', 'completed', 'rejected', 'cancelled']);

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const statusRaw = req.nextUrl.searchParams.get('status') ?? 'pending';

    const where: Prisma.TeacherWithdrawalWhereInput = {};
    if (statusRaw !== 'all') {
      if (!VALID.has(statusRaw)) {
        return jsonResponse({ error: "Noto'g'ri status" }, { status: 400 });
      }
      where.status = statusRaw;
    }

    const rows = await prisma.teacherWithdrawal.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: 100,
      include: {
        teacher: { select: { fullName: true, email: true } },
      },
    });

    const withdrawals = rows.map((w) => ({
      id: w.id,
      teacherId: w.teacherId,
      teacherName: w.teacher?.fullName ?? '—',
      teacherEmail: w.teacher?.email ?? '',
      amountUzs: w.amountUzs.toString(),
      status: w.status,
      method: w.method,
      bankName: w.bankName,
      bankAccountNumber: w.bankAccountNumber,
      cardNumber: w.cardNumber,
      recipientName: w.recipientName,
      note: w.note,
      adminNote: w.adminNote,
      rejectionReason: w.rejectionReason,
      requestedAt: w.requestedAt,
      processedAt: w.processedAt,
      completedAt: w.completedAt,
    }));

    return jsonResponse({ withdrawals });
  } catch (err) {
    return errorResponse(err);
  }
}
