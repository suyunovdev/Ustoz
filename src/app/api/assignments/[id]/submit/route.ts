/**
 * POST /api/assignments/[id]/submit
 * Topshiriq topshirish.
 *
 * Barcha validatsiya (kursga yozilganlik, muddat, kontent turi, URL, bo'sh
 * submission) `submitAssignment` service'ida. Ilgari bu route service'ni chetlab
 * o'tib, to'g'ridan-to'g'ri repo'ga yozardi — bo'sh/yaroqsiz topshiriq qabul
 * qilinardi (C1).
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse, serializeData } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  submitAssignment,
  type SubmitInput,
  AssignmentNotFoundError,
  AssignmentNotPublishedError,
  DeadlinePassedError,
  NotEnrolledError,
} from '@/lib/services/assignment.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireStudent(req);
    const { id: assignmentId } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }

    const input: SubmitInput = {
      submissionText: typeof body.submissionText === 'string' ? body.submissionText : undefined,
      submissionUrl: typeof body.submissionUrl === 'string' ? body.submissionUrl : undefined,
      attachments: Array.isArray(body.attachments)
        ? (body.attachments as SubmitInput['attachments'])
        : undefined,
    };

    const submission = await submitAssignment(assignmentId, session.sub, input);
    return jsonResponse({ submission: serializeData(submission) }, { status: 201 });
  } catch (err) {
    if (err instanceof AssignmentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AssignmentNotPublishedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 400 });
    }
    if (err instanceof NotEnrolledError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof DeadlinePassedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 400 });
    }
    return errorResponse(err);
  }
}
