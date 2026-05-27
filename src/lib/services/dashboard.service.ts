/**
 * Dashboard Service — orchestrator.
 *
 * Bitta funksiya: student dashboard uchun barcha kerakli ma'lumotni yig'adi.
 * Ham `/api/enrollments/my` route handler, ham Next.js Server Component
 * (`page.tsx`'da `prefetchQuery`) shu funksiyani chaqiradi.
 *
 * Data layer: repository'lar orqali (test qilish oson).
 */

import { serializeData } from '@/lib/json';
import { enrollmentRepo, certificateRepo } from '@/lib/repositories';
import { computeProgressForEnrollments } from './dashboard-progress.helper';
import { getStreakData } from './streak.service';
import { getRecommendedCourses } from './recommendation.service';
import type { DashboardData } from '@/types/dashboard.types';

export async function loadDashboardData(studentId: string): Promise<DashboardData> {
  // 1) Parallel data fetch (har data source 1 query — N+1 yo'q)
  const [enrollments, certificates, streakData, recommended] = await Promise.all([
    enrollmentRepo.findActiveByStudent(studentId),
    certificateRepo.findByStudent(studentId),
    getStreakData(studentId),
    getRecommendedCourses(studentId, 6),
  ]);

  // 2) Progress meta (N+1'siz: helper'da 2 ta query barcha enrollment uchun)
  const progressMeta = await computeProgressForEnrollments(
    studentId,
    enrollments.map((e) => ({ courseId: e.courseId })),
  );

  const completedCount = enrollments.filter((e) => e.progress >= 100).length;

  const payload: DashboardData = {
    enrollments: enrollments.map((e) => {
      const meta = progressMeta.get(e.courseId);
      return {
        id: e.id,
        courseId: e.courseId,
        progress: e.progress,
        enrolledAt: e.enrolledAt.toISOString(),
        completedAt: e.completedAt ? e.completedAt.toISOString() : null,
        lastAccessedAt: e.lastAccessedAt ? e.lastAccessedAt.toISOString() : null,
        isCompleted: e.progress >= 100,
        nextTopic: meta?.nextTopic ?? null,
        completedTopicsCount: meta?.completedTopicsCount ?? 0,
        totalTopics: meta?.totalTopics ?? e.course._count.topics,
        course: {
          id: e.course.id,
          title: e.course.title,
          coverImage: e.course.coverImage,
          totalTopics: e.course._count.topics,
          totalDuration: e.course.totalDuration,
          teacherName: e.course.teacher.fullName,
          teacherAvatar: e.course.teacher.avatarUrl,
        },
      };
    }),
    recommended,
    certificates: certificates.map((cert) => ({
      id: cert.id,
      courseId: cert.courseId,
      courseTitle: cert.course.title,
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt.toISOString(),
      verificationUrl: cert.verificationUrl,
    })),
    stats: {
      enrolledCount: enrollments.length,
      coursesCompleted: completedCount,
      certificatesEarned: certificates.length,
      streak: {
        current: streakData.current,
        longest: streakData.longest,
        activeToday: streakData.activeToday,
      },
    },
  };

  return serializeData(payload);
}
