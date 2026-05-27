/**
 * Dashboard API type'lari
 *
 * Server: `GET /api/enrollments/my` va `POST /api/topics/[id]/complete`
 * Manba: src/app/api/enrollments/my/route.ts + src/lib/services/dashboard-progress.helper.ts
 */

export interface DashboardCourse {
  id: string;
  title: string;
  coverImage: string | null;
  totalTopics: number;
  totalDuration: number;
  teacherName: string;
  teacherAvatar: string | null;
}

export interface NextTopic {
  id: string;
  title: string;
  orderIndex: number;
}

export interface DashboardEnrollment {
  id: string;
  courseId: string;
  progress: number;            // 0–100
  enrolledAt: string;          // ISO
  completedAt: string | null;  // ISO yoki null
  lastAccessedAt: string | null; // ISO yoki null — hero card uchun
  isCompleted: boolean;

  // Yangi maydonlar (backend Task 1.3 dan):
  nextTopic: NextTopic | null;
  completedTopicsCount: number;
  totalTopics: number;

  course: DashboardCourse;
}

// Recommended kurslar — recommendation service'dan keladi (60/30/10 personalized).
import type { RecommendedCourse as _RC } from './recommendation.types';
export type { RecommendedCourse, RecommendReason, CategoryItem } from './recommendation.types';
type RecommendedCourse = _RC;

export interface CertificateSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  verificationUrl: string | null;
}

export interface DashboardStreak {
  current: number;
  longest: number;
  activeToday: boolean;
}

export interface DashboardStats {
  enrolledCount: number;
  coursesCompleted: number;
  certificatesEarned: number;
  streak: DashboardStreak;
}

export interface DashboardData {
  enrollments: DashboardEnrollment[];
  recommended: RecommendedCourse[];
  certificates: CertificateSummary[];
  stats: DashboardStats;
}

/** POST /api/topics/[id]/complete response */
export interface CompleteTopicResponse {
  success: true;
  progress: number;
  isCourseCompleted: boolean;
  wasAlreadyCompleted: boolean;
  shouldShowCertificateModal?: boolean;
}

/** GET /api/enrollments/[courseId]/progress response */
export interface CourseProgressResponse {
  courseId: string;
  progress: number;
  completedTopicIds: string[];
  nextTopic: NextTopic | null;
  isCompleted: boolean;
  completedAt: string | null;
}
