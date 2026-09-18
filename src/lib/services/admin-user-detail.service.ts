/**
 * Admin foydalanuvchi-detali — rolga qarab to'liq ma'lumot bundle'i.
 * Mavjud servislarni COMPOSITION qiladi (yangi biznes-logika minimal):
 *   teacher → getTeacherDashboard + getBalance + getActiveApplication (+ maskalangan payout)
 *   student → getStudentDetailForAdmin (barcha kurslar bo'yicha)
 *   admin   → faqat base info
 * Faqat admin route'idan (`requireAdmin`) chaqiriladi.
 */
import { findDetailForAdmin } from '@/lib/repositories/user.repository';
import { getStudentDetailForAdmin } from '@/lib/repositories/student.repository';
import { getTeacherDashboard } from './teacher-stats.service';
import { getBalance } from './teacher-earnings.service';
import { getActiveApplication } from './teacher-application.service';

/** Karta/hisob raqamini maskalaydi — HECH QACHON to'liq qaytarilmaydi (oxirgi 4 raqam). */
function maskTail(v: string | null, keep = 4): string | null {
  if (!v) return null;
  const digits = v.replace(/\s+/g, '');
  if (digits.length <= keep) return `**** ${digits}`;
  return `**** ${digits.slice(-keep)}`;
}

export async function getUserDetailForAdmin(userId: string) {
  const user = await findDetailForAdmin(userId);
  if (!user) return null;

  const base = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    phone: user.phone,
    headline: user.headline,
    referralCode: user.referralCode,
    isActive: user.isActive,
    deletedAt: user.deletedAt,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };

  if (user.role === 'teacher') {
    const [dashboard, balance, application] = await Promise.all([
      getTeacherDashboard(userId),
      getBalance(userId),
      getActiveApplication(userId).catch(() => null),
    ]);
    return {
      user: base,
      teacher: {
        stats: dashboard.stats,
        courses: dashboard.courses.map((c) => ({
          id: c.id,
          title: c.title,
          moderationStatus: c.moderationStatus,
          enrollmentCount: c.enrollmentCount,
          rating: c.rating,
          reviewCount: c.reviewCount,
          topicCount: c.topicCount,
          revenueUzs: c.revenueUzs,
        })),
        balance,
        payout: {
          bankName: user.payoutBankName,
          recipientName: user.payoutRecipientName,
          cardNumber: maskTail(user.payoutCardNumber),
          accountNumber: maskTail(user.payoutAccountNumber),
          hasPayout: !!(user.payoutCardNumber || user.payoutAccountNumber || user.payoutBankName),
        },
        application: application
          ? {
              status: application.status,
              expertise: application.expertise,
              createdAt: application.createdAt,
              feedback: application.feedback,
            }
          : null,
      },
    };
  }

  if (user.role === 'student') {
    const detail = await getStudentDetailForAdmin(userId);
    return {
      user: base,
      student: detail
        ? {
            enrollments: detail.enrollments,
            stats: {
              totalTopicCompletions: detail.totalTopicCompletions,
              totalTestAttempts: detail.totalTestAttempts,
              passedTestAttempts: detail.passedTestAttempts,
              avgTestScore: detail.avgTestScore,
              totalAssignmentSubmissions: detail.totalAssignmentSubmissions,
              gradedAssignmentSubmissions: detail.gradedAssignmentSubmissions,
              avgAssignmentGrade: detail.avgAssignmentGrade,
              totalCertificates: detail.totalCertificates,
              totalPaymentsUzs: detail.totalPaymentsUzs,
            },
          }
        : { enrollments: [], stats: null },
    };
  }

  // admin — moliya/kurs bo'limlari yo'q
  return { user: base };
}
