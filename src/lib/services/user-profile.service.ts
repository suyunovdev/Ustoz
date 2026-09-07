/**
 * User Profile Service.
 *
 * Funksiyalar:
 *   - Profile view/edit (ism, bio, avatar, headline, expertise, social)
 *   - Password change (eski + yangi)
 *   - Notification preferences (per-type email/in-app)
 *   - Account deletion request (soft + cancel)
 *   - Public teacher profile (anonim foydalanuvchi uchun)
 */

import bcrypt from 'bcryptjs';
import { userProfileRepo } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { validatePassword } from '@/lib/validation';

export class ProfileNotFoundError extends Error {
  code = 'PROFILE_NOT_FOUND';
  constructor() {
    super("Profil topilmadi");
    this.name = 'ProfileNotFoundError';
  }
}

export class InvalidPasswordError extends Error {
  code = 'INVALID_PASSWORD';
  constructor() {
    super("Eski parol noto'g'ri");
    this.name = 'InvalidPasswordError';
  }
}

const MAX_BIO_LENGTH = 1000;
const MAX_HEADLINE_LENGTH = 150;
const ALLOWED_SOCIALS = new Set([
  'website',
  'twitter',
  'linkedin',
  'telegram',
  'instagram',
  'youtube',
  'facebook',
  'github',
]);

const ALLOWED_PREF_KEYS = new Set([
  'email_enrollment',
  'email_assignment_submission',
  'email_quiz_completion',
  'email_course_update',
  'email_achievement',
  'email_payment',
  'email_message',
  'email_review',
  'in_app_enabled',
]);

function validateUrl(value: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new ValidationError("Yaroqsiz URL");
  }
}

// ==================== READ ====================

export async function getMyProfile(userId: string) {
  const [profile, user] = await Promise.all([
    userProfileRepo.getFullProfile(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { totpEnabled: true } }),
  ]);
  if (!profile) throw new ProfileNotFoundError();
  return { ...profile, twoFactorEnabled: user?.totpEnabled ?? false };
}

// ==================== UPDATE ====================

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string;
  phone?: string | null;
  interests?: string[];
  headline?: string;
  expertise?: string[];
  socialLinks?: Record<string, string>;
}

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  const patch: Parameters<typeof userProfileRepo.updateProfile>[1] = {};

  if (input.fullName !== undefined) {
    const name = input.fullName.trim();
    if (name.length < 2) throw new ValidationError("Ism kamida 2 belgi");
    if (name.length > 100) throw new ValidationError("Ism 100 belgidan oshmasin");
    patch.fullName = name;
  }
  if (input.avatarUrl !== undefined) {
    if (input.avatarUrl === null || input.avatarUrl === '') {
      patch.avatarUrl = null;
    } else {
      patch.avatarUrl = validateUrl(input.avatarUrl);
    }
  }
  if (input.bio !== undefined) {
    const bio = input.bio.trim();
    if (bio.length > MAX_BIO_LENGTH) {
      throw new ValidationError(`Bio ${MAX_BIO_LENGTH} belgidan oshmasin`);
    }
    patch.bio = bio || null;
  }
  if (input.phone !== undefined) {
    if (input.phone === null || input.phone.trim() === '') {
      patch.phone = null;
    } else {
      // Faqat raqam, +, bo'sh joy, tire, qavs — normallashtirilib saqlanadi.
      const raw = input.phone.trim();
      if (!/^[+\d][\d\s()-]{6,19}$/.test(raw)) {
        throw new ValidationError("Telefon raqami noto'g'ri formatda");
      }
      patch.phone = raw.replace(/[\s()-]/g, '');
    }
  }
  if (input.interests !== undefined) {
    if (input.interests.length > 10) {
      throw new ValidationError("Maksimum 10 ta qiziqish");
    }
    patch.interests = input.interests
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.length <= 40);
  }
  if (input.headline !== undefined) {
    const h = input.headline.trim();
    if (h.length > MAX_HEADLINE_LENGTH) {
      throw new ValidationError(`Headline ${MAX_HEADLINE_LENGTH} belgidan oshmasin`);
    }
    patch.headline = h || null;
  }
  if (input.expertise !== undefined) {
    if (input.expertise.length > 20) {
      throw new ValidationError("Maksimum 20 ta mavzu");
    }
    const cleaned = input.expertise
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.length <= 50);
    patch.expertise = cleaned;
  }
  if (input.socialLinks !== undefined) {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.socialLinks)) {
      if (!ALLOWED_SOCIALS.has(key)) continue;
      if (typeof value !== 'string') continue;
      const trimmed = value.trim();
      if (trimmed.length === 0) continue;
      cleaned[key] = validateUrl(trimmed);
    }
    patch.socialLinks = cleaned;
  }

  return userProfileRepo.updateProfile(userId, patch);
}

// ==================== PASSWORD ====================

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  // Yagona parol siyosati (register/OTP-signup/reset bilan bir xil).
  const pwErr = validatePassword(newPassword);
  if (pwErr) throw new ValidationError(pwErr);
  if (newPassword.length > 100) {
    throw new ValidationError("Parol 100 belgidan oshmasin");
  }
  if (oldPassword === newPassword) {
    throw new ValidationError("Yangi parol eskidan farqli bo'lishi kerak");
  }

  const currentHash = await userProfileRepo.getPasswordHash(userId);
  if (!currentHash) throw new ProfileNotFoundError();

  const valid = await bcrypt.compare(oldPassword, currentHash);
  if (!valid) throw new InvalidPasswordError();

  const newHash = await bcrypt.hash(newPassword, 12);
  await userProfileRepo.setPasswordHash(userId, newHash);
  // Parol o'zgardi → barcha eski JWT sessiyalarni bekor qilish (tokenVersion inkrement).
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

// ==================== NOTIFICATION PREFS ====================

export async function updateNotificationPrefs(
  userId: string,
  prefs: Record<string, boolean>,
) {
  const cleaned: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(prefs)) {
    if (!ALLOWED_PREF_KEYS.has(key)) continue;
    if (typeof value !== 'boolean') continue;
    cleaned[key] = value;
  }
  return userProfileRepo.updateNotificationPrefs(userId, cleaned);
}

// ==================== DELETION REQUEST ====================

export async function requestAccountDeletion(userId: string, reason: string | null) {
  if (reason && reason.length > 500) {
    throw new ValidationError("Sabab 500 belgidan oshmasin");
  }
  await userProfileRepo.requestDeletion(userId, reason?.trim() ?? null);
}

export async function cancelAccountDeletion(userId: string) {
  await userProfileRepo.cancelDeletionRequest(userId);
}

// ==================== PUBLIC ====================

export async function getPublicTeacherProfile(teacherId: string) {
  const profile = await userProfileRepo.getPublicTeacher(teacherId);
  if (!profile) throw new ProfileNotFoundError();
  return profile;
}

export async function listPublicTeacherCourses(teacherId: string) {
  const rows = await userProfileRepo.listPublicTeacherCourses(teacherId);
  return rows.map((c) => ({
    ...c,
    priceUzs: c.priceUzs.toString(),
    rating: Number(c.rating),
  }));
}
