/**
 * GET   /api/profile
 * PATCH /api/profile
 *
 * Body (PATCH): { fullName?, avatarUrl?, bio?, headline?, expertise?, socialLinks? }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getMyProfile,
  updateMyProfile,
  ProfileNotFoundError,
} from '@/lib/services/user-profile.service';
import { ValidationError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const profile = await getMyProfile(session.sub);
    return jsonResponse({ profile });
  } catch (err) {
    if (err instanceof ProfileNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const expertise = Array.isArray(b.expertise)
      ? (b.expertise as unknown[]).filter((x): x is string => typeof x === 'string')
      : undefined;
    const socialLinks =
      b.socialLinks && typeof b.socialLinks === 'object'
        ? (b.socialLinks as Record<string, string>)
        : undefined;

    const profile = await updateMyProfile(session.sub, {
      fullName: typeof b.fullName === 'string' ? b.fullName : undefined,
      avatarUrl:
        b.avatarUrl === null
          ? null
          : typeof b.avatarUrl === 'string'
          ? b.avatarUrl
          : undefined,
      bio: typeof b.bio === 'string' ? b.bio : undefined,
      headline: typeof b.headline === 'string' ? b.headline : undefined,
      expertise,
      socialLinks,
    });

    return jsonResponse({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}
