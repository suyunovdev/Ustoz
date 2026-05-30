/**
 * GET /api/teacher/topics/[topicId]/materials/export
 *
 * Mavzu materiallarini ZIP qilib qaytaradi.
 *
 * Tarkibi:
 *   - manifest.json — barcha materiallar ro'yxati (id, title, type, fileUrl)
 *   - materials.csv — Excel/Sheets'da ochish uchun
 *   - links.md     — Markdown formatda barcha URL'lar
 *
 * Eslatma: R2'dagi fayllarni ZIP ichiga embed qilmaymiz (kattalik chegarasi).
 * Foydalanuvchi URL'lardan o'zi yuklaydi.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listMaterials,
  TopicAccessDeniedError,
} from '@/lib/services/content-material.service';
import JSZip from 'jszip';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;

    const topic = await prisma.courseTopic.findUnique({
      where: { id: topicId },
      include: { course: { select: { title: true } } },
    });
    if (!topic) {
      return jsonResponse({ error: "Mavzu topilmadi", code: 'TOPIC_NOT_FOUND' }, { status: 404 });
    }

    const materials = await listMaterials(topicId, session.sub);

    const safeName = (topic.title || 'topic').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 50);
    const filename = `${safeName}-materials-${new Date().toISOString().slice(0, 10)}.zip`;

    const zip = new JSZip();

    const manifest = {
      generatedAt: new Date().toISOString(),
      generatedBy: session.sub,
      courseTitle: topic.course.title,
      topicTitle: topic.title,
      topicId,
      materialCount: materials.length,
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        materialType: m.materialType,
        fileUrl: m.fileUrl,
        fileName: m.fileName,
        fileSize: m.fileSize !== null && m.fileSize !== undefined ? m.fileSize.toString() : null,
        fileType: m.fileType,
        storageType: m.storageType,
        viewCount: m.viewCount,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const csvHeader = 'id,title,materialType,fileUrl,fileName,viewCount,createdAt\n';
    const csvRows = materials
      .map((m) => {
        const esc = (v: unknown) =>
          v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`;
        return [
          m.id,
          esc(m.title),
          m.materialType,
          esc(m.fileUrl),
          esc(m.fileName),
          m.viewCount,
          m.createdAt.toISOString(),
        ].join(',');
      })
      .join('\n');
    zip.file('materials.csv', csvHeader + csvRows + '\n');

    const md = [
      `# ${topic.title}`,
      ``,
      `Kurs: **${topic.course.title}**`,
      `Jami: ${materials.length} ta material`,
      `Yaratildi: ${new Date().toLocaleString('uz-UZ')}`,
      ``,
      `---`,
      ``,
      ...materials.map(
        (m, i) =>
          `${i + 1}. **${m.title}** _(${m.materialType})_  \n   ` +
          (m.fileUrl ? `URL: ${m.fileUrl}  \n   ` : '') +
          (m.description ? `Tavsif: ${m.description}  \n   ` : '') +
          `Ko'rishlar: ${m.viewCount}\n`,
      ),
    ].join('\n');
    zip.file('links.md', md);

    const buffer = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof TopicAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
