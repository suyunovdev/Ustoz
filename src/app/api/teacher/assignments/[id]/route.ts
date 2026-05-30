/**
 * GET    /api/teacher/assignments/[id]
 * PATCH  /api/teacher/assignments/[id]
 * DELETE /api/teacher/assignments/[id]
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getAssignmentForTeacher,
  updateAssignment,
  deleteAssignment,
  AssignmentNotFoundError,
  AssignmentAccessDeniedError,
} from '@/lib/services/assignment.service';
import { ValidationError } from '@/lib/errors';
import type { AssignmentStatus, SubmissionType } from '@/lib/repositories';

const VALID_STATUSES: ReadonlyArray<AssignmentStatus> = ['draft', 'published', 'archived'];
const VALID_TYPES: ReadonlyArray<SubmissionType> = ['text', 'file', 'url', 'any'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const assignment = await getAssignmentForTeacher(id, session.sub);
    return jsonResponse({ assignment });
  } catch (err) {
    if (err instanceof AssignmentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AssignmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function PATCH(
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
    const b = (body ?? {}) as Record<string, unknown>;

    const status =
      typeof b.status === 'string' && VALID_STATUSES.includes(b.status as AssignmentStatus)
        ? (b.status as AssignmentStatus)
        : undefined;
    const submissionType =
      typeof b.submissionType === 'string' &&
      VALID_TYPES.includes(b.submissionType as SubmissionType)
        ? (b.submissionType as SubmissionType)
        : undefined;

    const updated = await updateAssignment(id, session.sub, {
      title: typeof b.title === 'string' ? b.title : undefined,
      description:
        b.description === null
          ? null
          : typeof b.description === 'string'
          ? b.description
          : undefined,
      instructions:
        b.instructions === null
          ? null
          : typeof b.instructions === 'string'
          ? b.instructions
          : undefined,
      dueDate:
        typeof b.dueDate === 'string' ? new Date(b.dueDate) : undefined,
      maxScore: typeof b.maxScore === 'number' ? b.maxScore : undefined,
      fileRequirements:
        b.fileRequirements === null
          ? null
          : typeof b.fileRequirements === 'string'
          ? b.fileRequirements
          : undefined,
      submissionType,
      allowLateSubmission:
        typeof b.allowLateSubmission === 'boolean' ? b.allowLateSubmission : undefined,
      latePenaltyPercent:
        typeof b.latePenaltyPercent === 'number' ? b.latePenaltyPercent : undefined,
      status,
      topicId:
        b.topicId === null
          ? null
          : typeof b.topicId === 'string'
          ? b.topicId
          : undefined,
    });

    return jsonResponse({ assignment: updated });
  } catch (err) {
    if (err instanceof AssignmentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AssignmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    await deleteAssignment(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof AssignmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
