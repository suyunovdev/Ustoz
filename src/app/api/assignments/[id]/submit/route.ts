/**
 * POST /api/assignments/[id]/submit
 *
 * Talaba vazifa topshiradi.
 *
 * Body:
 *   {
 *     submissionText?: string,
 *     submissionUrl?: string,
 *     attachments?: [{ fileUrl, fileName?, fileSize?, fileType? }]
 *   }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  submitAssignment,
  AssignmentNotFoundError,
  AssignmentNotPublishedError,
  DeadlinePassedError,
  NotEnrolledError,
} from '@/lib/services/assignment.service';
import { ValidationError } from '@/lib/errors';
import type { AttachmentJSON } from '@/lib/repositories';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const attachments = Array.isArray(b.attachments)
      ? (b.attachments as AttachmentJSON[]).filter(
          (att) => typeof att === 'object' && att !== null && typeof att.fileUrl === 'string',
        )
      : undefined;

    const submission = await submitAssignment(id, session.sub, {
      submissionText: typeof b.submissionText === 'string' ? b.submissionText : undefined,
      submissionUrl: typeof b.submissionUrl === 'string' ? b.submissionUrl : undefined,
      attachments,
    });

    return jsonResponse({ submission }, { status: 201 });
  } catch (err) {
    if (err instanceof AssignmentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AssignmentNotPublishedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof NotEnrolledError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof DeadlinePassedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
