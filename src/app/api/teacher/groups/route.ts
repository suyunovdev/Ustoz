// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/groups — Guruhlar ro'yxati
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const groups = await prisma.group.findMany({
    where: { teacherId: session.sub },
    include: {
      course: { select: { title: true } },
      members: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    groups: groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      courseTitle: g.course?.title,
      maxMembers: g.maxMembers,
      memberCount: g.members.length,
      status: g.status,
      createdAt: g.createdAt,
    })),
  });
}

// POST /api/teacher/groups — Guruh yaratish
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { name, description, courseId, maxMembers = 30, studentIds = [] } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'Guruh nomi majburiy' }, { status: 400 });
  }

  // Agar courseId berilgan bo'lsa — teacher kursimi tekshirish
  if (courseId) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: session.sub },
    });
    if (!course) return NextResponse.json({ error: 'Kurs topilmadi' }, { status: 404 });
  }

  const group = await prisma.group.create({
    data: {
      teacherId: session.sub,
      name,
      description,
      courseId: courseId || null,
      maxMembers,
      members: studentIds.length
        ? {
            createMany: {
              data: studentIds.map((sid: string) => ({ studentId: sid })),
              skipDuplicates: true,
            },
          }
        : undefined,
    },
    include: { members: true },
  });

  return NextResponse.json({ group }, { status: 201 });
}

// GET /api/teacher/groups/students — Teacher kurslariga enrolled studentlar
export async function HEAD(req: NextRequest) {
  // Bu endpoint uchun alohida route ishlatiladi
  return NextResponse.json({});
}
