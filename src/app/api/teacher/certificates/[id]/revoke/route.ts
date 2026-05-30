/**
 * POST /api/teacher/certificates/[id]/revoke
 * Body: { reason: string }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  revokeByTeacher,
  CertificateAccessDeniedError,
} from '@/lib/services/certificate.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const reason = (body as { reason?: unknown })?.reason;
    if (typeof reason !== 'string') throw new ValidationError("reason majburiy");
    await revokeByTeacher(id, session.sub, reason);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof CertificateAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
