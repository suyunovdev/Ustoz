/**
 * DELETE /api/teacher/external-links/[id]  — havolani o'chirish (faqat egasi)
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;

    const link = await prisma.externalLink.findUnique({
      where: { id },
      select: { teacherId: true },
    });
    if (!link || link.teacherId !== session.sub) {
      return jsonResponse({ error: 'Havola topilmadi' }, { status: 404 });
    }

    await prisma.externalLink.delete({ where: { id } });
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
