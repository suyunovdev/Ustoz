/**
 * User Profile repository — settings + public profile.
 *
 * NotificationPrefs JSON shape:
 *   {
 *     email_enrollment, email_assignment_submission, email_quiz_completion,
 *     email_course_update, email_achievement, email_payment, email_message,
 *     email_review, in_app_enabled
 *   }
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export interface ProfileFullRow {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  expertise: string[];
  socialLinks: Record<string, string>;
  notificationPrefs: Record<string, boolean>;
  deletionRequestedAt: Date | null;
  deletionReason: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface PublicTeacherRow {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  expertise: string[];
  socialLinks: Record<string, string>;
  joinedAt: Date;
  // Aggregate stats
  totalCourses: number;
  totalStudents: number;
  avgRating: number;
  totalReviews: number;
}

const DEFAULT_PREFS = {
  email_enrollment: true,
  email_assignment_submission: true,
  email_quiz_completion: false,
  email_course_update: true,
  email_achievement: false,
  email_payment: true,
  email_message: true,
  email_review: true,
  in_app_enabled: true,
};

function toPrefs(v: any): Record<string, boolean> {
  if (!v || typeof v !== 'object') return DEFAULT_PREFS;
  return { ...DEFAULT_PREFS, ...v };
}

function toSocial(v: any): Record<string, string> {
  if (!v || typeof v !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(v)) {
    if (typeof val === 'string' && val.length > 0) {
      result[key] = val;
    }
  }
  return result;
}

export async function getFullProfile(userId: string): Promise<ProfileFullRow | null> {
  const p = await prisma.userProfile.findUnique({
    where: { id: userId },
  });
  if (!p) return null;
  return {
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    role: p.role,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    headline: p.headline,
    expertise: p.expertise,
    socialLinks: toSocial(p.socialLinks),
    notificationPrefs: toPrefs(p.notificationPrefs),
    deletionRequestedAt: p.deletionRequestedAt,
    deletionReason: p.deletionReason,
    createdAt: p.createdAt,
    lastLoginAt: p.lastLoginAt,
  };
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  headline?: string | null;
  expertise?: string[];
  socialLinks?: Record<string, string>;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<ProfileFullRow> {
  const updated = await prisma.userProfile.update({
    where: { id: userId },
    data: {
      ...(input.fullName !== undefined && { fullName: input.fullName }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      ...(input.bio !== undefined && { bio: input.bio }),
      ...(input.headline !== undefined && { headline: input.headline }),
      ...(input.expertise !== undefined && { expertise: input.expertise }),
      ...(input.socialLinks !== undefined && {
        socialLinks: input.socialLinks as Prisma.InputJsonValue,
      }),
    },
  });
  return {
    id: updated.id,
    email: updated.email,
    fullName: updated.fullName,
    role: updated.role,
    avatarUrl: updated.avatarUrl,
    bio: updated.bio,
    headline: updated.headline,
    expertise: updated.expertise,
    socialLinks: toSocial(updated.socialLinks),
    notificationPrefs: toPrefs(updated.notificationPrefs),
    deletionRequestedAt: updated.deletionRequestedAt,
    deletionReason: updated.deletionReason,
    createdAt: updated.createdAt,
    lastLoginAt: updated.lastLoginAt,
  };
}

export async function updateNotificationPrefs(
  userId: string,
  prefs: Record<string, boolean>,
): Promise<Record<string, boolean>> {
  // Merge with current
  const current = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true },
  });
  const merged = { ...toPrefs(current?.notificationPrefs), ...prefs };
  await prisma.userProfile.update({
    where: { id: userId },
    data: { notificationPrefs: merged as Prisma.InputJsonValue },
  });
  return merged;
}

export async function getPasswordHash(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return u?.passwordHash ?? null;
}

export async function setPasswordHash(
  userId: string,
  newHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });
}

export async function requestDeletion(
  userId: string,
  reason: string | null,
): Promise<void> {
  await prisma.userProfile.update({
    where: { id: userId },
    data: {
      deletionRequestedAt: new Date(),
      deletionReason: reason,
    },
  });
}

export async function cancelDeletionRequest(userId: string): Promise<void> {
  await prisma.userProfile.update({
    where: { id: userId },
    data: { deletionRequestedAt: null, deletionReason: null },
  });
}

// ==================== PUBLIC TEACHER PROFILE ====================

export async function getPublicTeacher(
  teacherId: string,
): Promise<PublicTeacherRow | null> {
  const p = await prisma.userProfile.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
      headline: true,
      expertise: true,
      socialLinks: true,
      createdAt: true,
      role: true,
    },
  });
  if (!p || p.role !== 'teacher') return null;

  const [courseStats, reviewStats] = await Promise.all([
    prisma.$queryRaw<
      Array<{ totalCourses: bigint; totalStudents: bigint }>
    >`
      SELECT
        COUNT(DISTINCT c.id)::bigint AS "totalCourses",
        COALESCE(COUNT(DISTINCT e.student_id)::bigint, 0) AS "totalStudents"
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      WHERE c.teacher_id = ${teacherId}::uuid
        AND c.is_published = TRUE
    `,
    prisma.$queryRaw<Array<{ avgRating: number; totalReviews: bigint }>>`
      SELECT
        COALESCE(AVG(cr.rating)::float, 0) AS "avgRating",
        COUNT(*)::bigint AS "totalReviews"
      FROM course_reviews cr
      JOIN courses c ON c.id = cr.course_id
      WHERE c.teacher_id = ${teacherId}::uuid
        AND cr.hidden_at IS NULL
    `,
  ]);

  return {
    id: p.id,
    fullName: p.fullName,
    avatarUrl: p.avatarUrl,
    bio: p.bio,
    headline: p.headline,
    expertise: p.expertise,
    socialLinks: toSocial(p.socialLinks),
    joinedAt: p.createdAt,
    totalCourses: Number(courseStats[0]?.totalCourses ?? 0),
    totalStudents: Number(courseStats[0]?.totalStudents ?? 0),
    avgRating: Math.round((reviewStats[0]?.avgRating ?? 0) * 100) / 100,
    totalReviews: Number(reviewStats[0]?.totalReviews ?? 0),
  };
}

export async function listPublicTeacherCourses(teacherId: string) {
  return prisma.course.findMany({
    where: { teacherId, isPublished: true, moderationStatus: 'approved' },
    select: {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      priceUzs: true,
      rating: true,
      reviewCount: true,
      enrollmentCount: true,
      language: true,
      createdAt: true,
    },
    orderBy: { enrollmentCount: 'desc' },
    take: 20,
  });
}
