/**
 * GET  /api/teacher/certificates?courseId=&status=&search=&cursor=
 * POST /api/teacher/certificates — manual issue
 *
 * Body (POST): { studentId, courseId, finalGrade?, forceIssue? }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listForTeacher,
  manualIssueByTeacher,
  CertificateAccessDeniedError,
  NotEligibleError,
} from '@/lib/services/certificate.service';
import { ValidationError } from '@/lib/errors';
import type { CertificateStatus } from '@/lib/repositories';

const VALID_STATUSES: ReadonlyArray<CertificateStatus> = ['active', 'revoked'];

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const statusParam = searchParams.get('status');
    const status =
      statusParam && VALID_STATUSES.includes(statusParam as CertificateStatus)
        ? (statusParam as CertificateStatus)
        : undefined;
    const search = searchParams.get('search') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;

    const result = await listForTeacher(session.sub, {
      courseId,
      status,
      search,
      cursor,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const studentId = typeof b.studentId === 'string' ? b.studentId : '';
    const courseId = typeof b.courseId === 'string' ? b.courseId : '';
    if (!studentId) throw new ValidationError("studentId majburiy");
    if (!courseId) throw new ValidationError("courseId majburiy");

    const result = await manualIssueByTeacher(session.sub, {
      studentId,
      courseId,
      finalGrade: typeof b.finalGrade === 'number' ? b.finalGrade : undefined,
      forceIssue: typeof b.forceIssue === 'boolean' ? b.forceIssue : false,
    });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    if (err instanceof CertificateAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof NotEligibleError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
