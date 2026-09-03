/**
 * Admin kontent boshqaruvi — istalgan o'qituvchining kursi/guruhini
 * o'chirish (egalik cheklovisiz). Faqat admin uchun.
 *
 * Teacher API'lari egalikка bog'langan (o'qituvchi faqat o'zinikini o'chiradi);
 * bu servis admin uchun override beradi. O'chirish DB CASCADE'ga tayanadi
 * (kurs -> topiclar/obunalar/testlar/sharhlar; guruh -> a'zolar).
 */

import { prisma } from '@/lib/prisma';

/** Prisma "record not found" (P2025) — o'chirishda umumiy holat. */
function isNotFound(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'P2025'
  );
}

export class ContentNotFoundError extends Error {
  code = 'NOT_FOUND';
  constructor(kind: string, id: string) {
    super(`${kind} topilmadi: ${id}`);
  }
}

/** Istalgan kursni force-delete (obunali bo'lsa ham — cascade bilan). */
export async function adminDeleteCourse(courseId: string): Promise<void> {
  try {
    await prisma.course.delete({ where: { id: courseId } });
  } catch (err) {
    if (isNotFound(err)) throw new ContentNotFoundError('Kurs', courseId);
    throw err;
  }
}

export class CannotDeleteAdminError extends Error {
  code = 'CANNOT_DELETE_ADMIN';
  constructor() {
    super("Admin akkauntini o'chirib bo'lmaydi");
  }
}

/**
 * Istalgan o'qituvchi/o'quvchi akkauntini o'chirish.
 * Admin akkauntlar himoyalangan (o'chirilmaydi). User o'chirilganda
 * user_profiles va barcha bog'liq kontent DB CASCADE bilan ketadi.
 */
export async function adminDeleteUser(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new ContentNotFoundError('Foydalanuvchi', userId);
  if (user.role === 'admin') throw new CannotDeleteAdminError();
  await prisma.user.delete({ where: { id: userId } });
}

/** Istalgan guruhni o'chirish (a'zolar cascade bilan). */
export async function adminDeleteGroup(groupId: string): Promise<void> {
  try {
    await prisma.group.delete({ where: { id: groupId } });
  } catch (err) {
    if (isNotFound(err)) throw new ContentNotFoundError('Guruh', groupId);
    throw err;
  }
}

export interface AdminGroupRow {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  courseId: string | null;
  memberCount: number;
  createdAt: Date;
}

/** Barcha guruhlar (admin ko'rinishi — barcha o'qituvchilarники). */
export async function adminListGroups(): Promise<AdminGroupRow[]> {
  const groups = await prisma.group.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      teacherId: true,
      courseId: true,
      memberCount: true,
      createdAt: true,
      teacher: { select: { fullName: true } },
    },
  });
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    teacherId: g.teacherId,
    teacherName: g.teacher?.fullName ?? '—',
    courseId: g.courseId,
    memberCount: g.memberCount,
    createdAt: g.createdAt,
  }));
}
