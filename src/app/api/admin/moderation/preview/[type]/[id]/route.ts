/**
 * GET /api/admin/moderation/preview/[type]/[id]
 *
 * Moderatsiya uchun kontent tafsilotlari:
 *   type = 'material' | 'link' | 'test'
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

type ContentType = 'material' | 'link' | 'test';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    await requireAdmin(req);
    const { type, id } = await params;

    if (!['material', 'link', 'test'].includes(type)) {
      return jsonResponse({ error: "Noto'g'ri kontent turi" }, { status: 400 });
    }

    const contentType = type as ContentType;

    if (contentType === 'material') {
      const material = await prisma.courseMaterial.findUnique({ where: { id } });
      if (!material) return jsonResponse({ error: 'Material topilmadi' }, { status: 404 });
      return jsonResponse({
        title: material.title,
        description: material.description,
        content_type: material.contentType || material.fileFormat || 'unknown',
        file_size: material.fileSize ? Number(material.fileSize) : undefined,
        watermark_enabled: material.watermarkEnabled,
        watermark_text: material.watermarkText,
        file_url: material.fileUrl,
      });
    }

    if (contentType === 'link') {
      const link = await prisma.externalLink.findUnique({ where: { id } });
      if (!link) return jsonResponse({ error: 'Havola topilmadi' }, { status: 404 });
      return jsonResponse({
        title: link.title,
        description: link.description,
        url: link.url,
        link_type: link.platform || 'other',
      });
    }

    // type === 'test'
    const test = await prisma.courseTest.findUnique({
      where: { id },
      include: { questions: { orderBy: { questionOrder: 'asc' } } },
    });
    if (!test) return jsonResponse({ error: 'Test topilmadi' }, { status: 404 });
    return jsonResponse({
      title: test.title,
      description: test.description,
      questions: test.questions.map((q) => ({
        id: q.id,
        question_text: q.questionText,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        correct_answer: ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer ?? ''),
        explanation: q.explanation,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
