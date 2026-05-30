/**
 * GET  /api/teacher-applications — joriy user'ning active arizasini ko'rsatadi
 * POST /api/teacher-applications — yangi ariza topshirish
 *
 * Auth: any logged-in user
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  submitApplication,
  getActiveApplication,
  ApplicationAlreadyExistsError,
  AlreadyTeacherError,
} from '@/lib/services/teacher-application.service';
import { ValidationError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const application = await getActiveApplication(session.sub);
    return jsonResponse({ application });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const application = await submitApplication(session.sub, {
      fullName: typeof b.fullName === 'string' ? b.fullName : '',
      email: typeof b.email === 'string' ? b.email : '',
      phone: typeof b.phone === 'string' ? b.phone : undefined,
      expertise: typeof b.expertise === 'string' ? b.expertise : '',
      bio: typeof b.bio === 'string' ? b.bio : '',
      motivation: typeof b.motivation === 'string' ? b.motivation : '',
      experience: typeof b.experience === 'string' ? b.experience : undefined,
      sampleUrl: typeof b.sampleUrl === 'string' ? b.sampleUrl : undefined,
    });

    return jsonResponse({ application });
  } catch (err) {
    if (err instanceof ApplicationAlreadyExistsError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    if (err instanceof AlreadyTeacherError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
