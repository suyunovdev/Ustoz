/**
 * GET  /api/teacher/external-links  — o'qituvchining tashqi havolalari
 * POST /api/teacher/external-links  — yangi havola qo'shish
 *
 * Teacher-scoped.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

type UiLinkType = 'telegram' | 'youtube' | 'other';

function normalizePlatform(type: unknown): UiLinkType {
  return type === 'telegram' || type === 'youtube' ? type : 'other';
}

function toUi(l: {
  id: string;
  platform: string | null;
  url: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: l.id,
    type: normalizePlatform(l.platform),
    url: l.url,
    title: l.title,
    description: l.description || '',
    addedDate: l.createdAt.toISOString().split('T')[0],
    status: l.status,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const rows = await prisma.externalLink.findMany({
      where: { teacherId: session.sub, status: { not: 'deleted' } },
      orderBy: { createdAt: 'desc' },
    });
    return jsonResponse({ links: rows.map(toUi) });
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

    const url = typeof body.url === 'string' ? body.url.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!url) throw new ValidationError('URL majburiy');
    if (!title) throw new ValidationError('Sarlavha majburiy');
    // Tashqi havola faqat http(s) bo'lishi kerak (javascript:/data: rad etiladi)
    if (!/^https?:\/\//i.test(url)) {
      throw new ValidationError("URL http:// yoki https:// bilan boshlanishi kerak");
    }

    const created = await prisma.externalLink.create({
      data: {
        teacherId: session.sub,
        platform: normalizePlatform(body.type),
        url,
        title,
        description: typeof body.description === 'string' ? body.description : null,
        status: 'active',
      },
    });

    return jsonResponse({ link: toUi(created) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
