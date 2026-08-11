/**
 * GET  /api/teacher/materials  — o'qituvchining kontent kutubxonasi (barcha materiallari)
 * POST /api/teacher/materials  — yangi material yozuvini qo'shish (fayl allaqachon /api/upload orqali yuklangan)
 *
 * Teacher-scoped: har bir o'qituvchi faqat o'z materiallarini ko'radi/boshqaradi.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

type UiType = 'document' | 'video' | 'audio';

function formatBytes(bytes: bigint | number | null): string {
  const n = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (!n || n <= 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

// "2.50 MB" | "512 KB" | "1024 B" → bytes (BigInt). Noto'g'ri → null.
function parseSizeToBytes(size: unknown): bigint | null {
  if (typeof size !== 'string') return null;
  const m = size.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!m) return null;
  const val = parseFloat(m[1]);
  if (!Number.isFinite(val)) return null;
  const unit = (m[2] || 'B').toUpperCase();
  const mult = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1;
  return BigInt(Math.round(val * mult));
}

function normalizeType(type: unknown): UiType {
  return type === 'video' || type === 'audio' ? type : 'document';
}

// DB yozuvini UI shakliga o'giradi
function toUi(m: {
  id: string;
  title: string;
  fileName: string | null;
  fileType: string | null;
  fileUrl: string | null;
  fileSize: bigint | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: m.id,
    name: m.title || m.fileName || '—',
    type: normalizeType(m.fileType),
    size: formatBytes(m.fileSize),
    uploadDate: m.createdAt.toISOString().split('T')[0],
    // content_materials.status: yangi yozuvlar 'pending', eski seed 'active' → 'approved'
    status: m.status === 'active' ? 'approved' : m.status,
    watermarkEnabled: false,
    url: m.fileUrl || '',
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const rows = await prisma.contentMaterial.findMany({
      where: { teacherId: session.sub, status: { not: 'deleted' } },
      orderBy: { createdAt: 'desc' },
    });
    return jsonResponse({ materials: rows.map(toUi) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Noto'g'ri so'rov tanasi");
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!name) throw new ValidationError('Nom majburiy');
    if (!url) throw new ValidationError('Fayl URL majburiy');
    // Faqat http(s) yoki nisbiy yo'l — javascript:/data:/blob: kabi sxemalarni rad etamiz
    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      throw new ValidationError("URL faqat http(s) yoki nisbiy yo'l bo'lishi mumkin");
    }

    const created = await prisma.contentMaterial.create({
      data: {
        teacherId: session.sub,
        title: name,
        fileName: name,
        fileType: normalizeType(body.type),
        fileUrl: url,
        fileSize: parseSizeToBytes(body.size),
        materialType: 'file',
        status: 'pending',
        storageType: 'external',
      },
    });

    return jsonResponse({ material: toUi(created) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
