/**
 * DELETE /api/teacher/materials/[id]  — materialni o'chirish (faqat egasi)
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

    // Ownership: faqat o'z materialini o'chira oladi
    const material = await prisma.contentMaterial.findUnique({
      where: { id },
      select: { teacherId: true },
    });
    if (!material || material.teacherId !== session.sub) {
      return jsonResponse({ error: 'Material topilmadi' }, { status: 404 });
    }

    await prisma.contentMaterial.delete({ where: { id } });
    return jsonResponse({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
