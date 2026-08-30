/**
 * GET  /api/topics/[topicId]/comments  — mavzu muhokamasi (izohlar ro'yxati)
 * POST /api/topics/[topicId]/comments  — yangi izoh qoldirish
 *
 * Kirish huquqi: shu kursga faol yozilgan talaba, kurs egasi (teacher) yoki admin.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import {
  notifyTeacherOfQuestion,
  notifyStudentsOfAnswer,
} from '@/lib/services/topic-qa.service';

const MAX_BODY = 2000;

async function assertAccess(topicId: string, userId: string, role: string) {
  const topic = await prisma.courseTopic.findUnique({
    where: { id: topicId },
    select: { id: true, title: true, courseId: true, course: { select: { teacherId: true } } },
  });
  if (!topic) return { ok: false as const, status: 404, error: 'Mavzu topilmadi' };

  const isAdmin = role === 'admin';
  const isOwnerTeacher = role === 'teacher' && topic.course?.teacherId === userId;
  if (isAdmin || isOwnerTeacher) return { ok: true as const, topic };

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId: topic.courseId } },
    select: { isActive: true },
  });
  if (enrollment?.isActive) return { ok: true as const, topic };
  return { ok: false as const, status: 403, error: 'Bu muhokamaga kirish huquqingiz yo\'q' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: topicId } = await params;

    const access = await assertAccess(topicId, session.sub, session.role);
    if (!access.ok) return jsonResponse({ error: access.error }, { status: access.status });

    const comments = await prisma.topicComment.findMany({
      where: { topicId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    // Mualliflar ma'lumotini bitta so'rovda olamiz (N+1 emas).
    const authorIds = [...new Set(comments.map((c) => c.userId))];
    const authors = authorIds.length
      ? await prisma.userProfile.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        })
      : [];
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return jsonResponse({
      comments: comments.map((c) => {
        const a = authorMap.get(c.userId);
        return {
          id: c.id,
          body: c.body,
          createdAt: c.createdAt.toISOString(),
          authorId: c.userId,
          authorName: a?.fullName ?? '—',
          authorAvatar: a?.avatarUrl ?? null,
          authorRole: a?.role ?? 'student',
          isMine: c.userId === session.sub,
        };
      }),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: topicId } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    if (!text) throw new ValidationError('Izoh matni bo\'sh bo\'lmasligi kerak');
    if (text.length > MAX_BODY) throw new ValidationError(`Izoh ${MAX_BODY} belgidan oshmasin`);

    const access = await assertAccess(topicId, session.sub, session.role);
    if (!access.ok) return jsonResponse({ error: access.error }, { status: access.status });

    const created = await prisma.topicComment.create({
      data: { topicId, userId: session.sub, body: text },
    });

    // Q&A xabar zanjiri (best-effort) — savol javobsiz qolmasin.
    //   talaba savol berdi  → o'qituvchi xabardor bo'ladi
    //   o'qituvchi/admin javob berdi → savol bergan talabalar xabardor bo'ladi
    try {
      const topicTitle = access.topic.title || 'Dars';
      const teacherId = access.topic.course?.teacherId ?? null;
      if (session.role === 'student' && teacherId) {
        await notifyTeacherOfQuestion({
          teacherId,
          studentId: session.sub,
          courseId: access.topic.courseId,
          topicId,
          topicTitle,
          body: text,
        });
      } else if (session.role === 'teacher' || session.role === 'admin') {
        await notifyStudentsOfAnswer({
          answererId: session.sub,
          courseId: access.topic.courseId,
          topicId,
          topicTitle,
          body: text,
        });
      }
    } catch (e) {
      console.error('Topic Q&A notification error:', e);
    }

    const profile = await prisma.userProfile.findUnique({
      where: { id: session.sub },
      select: { fullName: true, avatarUrl: true, role: true },
    });

    return jsonResponse(
      {
        comment: {
          id: created.id,
          body: created.body,
          createdAt: created.createdAt.toISOString(),
          authorId: session.sub,
          authorName: profile?.fullName ?? '—',
          authorAvatar: profile?.avatarUrl ?? null,
          authorRole: profile?.role ?? session.role,
          isMine: true,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
