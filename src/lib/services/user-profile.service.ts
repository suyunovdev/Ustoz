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
import { ValidationError } from '@/lib/errors';

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
  const profile = await userProfileRepo.getFullProfile(userId);
  if (!profile) throw new ProfileNotFoundError();
  return profile;
}

// ==================== UPDATE ====================

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string;
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
  if (newPassword.length < 6) {
    throw new ValidationError("Yangi parol kamida 6 belgi");
  }
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
