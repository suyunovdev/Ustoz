/**
 * GET  /api/teacher/assignments?courseId=&topicId=&status=
 * POST /api/teacher/assignments — yangi vazifa yaratish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  createAssignment,
  listTeacherAssignments,
  CourseAccessDeniedError,
} from '@/lib/services/assignment.service';
import { ValidationError } from '@/lib/errors';
import type { AssignmentStatus, SubmissionType } from '@/lib/repositories';

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const topicId = searchParams.get('topicId') ?? undefined;
    const status = (searchParams.get('status') as AssignmentStatus | null) ?? undefined;
    const assignments = await listTeacherAssignments(session.sub, {
      courseId,
      topicId,
      status,
    });
    return jsonResponse({ assignments });
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
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const courseId = typeof b.courseId === 'string' ? b.courseId : '';
    if (!courseId) throw new ValidationError("courseId majburiy");
    const dueDate = typeof b.dueDate === 'string' ? b.dueDate : '';
    if (!dueDate) throw new ValidationError("dueDate majburiy");

    const assignment = await createAssignment(session.sub, {
      courseId,
      topicId: typeof b.topicId === 'string' ? b.topicId : null,
      title: typeof b.title === 'string' ? b.title : '',
      description: typeof b.description === 'string' ? b.description : undefined,
      instructions: typeof b.instructions === 'string' ? b.instructions : undefined,
      dueDate,
      maxScore: typeof b.maxScore === 'number' ? b.maxScore : undefined,
      fileRequirements:
        typeof b.fileRequirements === 'string' ? b.fileRequirements : undefined,
      submissionType:
        typeof b.submissionType === 'string'
          ? (b.submissionType as SubmissionType)
          : undefined,
      allowLateSubmission:
        typeof b.allowLateSubmission === 'boolean' ? b.allowLateSubmission : undefined,
      latePenaltyPercent:
        typeof b.latePenaltyPercent === 'number' ? b.latePenaltyPercent : undefined,
    });

    return jsonResponse({ assignment }, { status: 201 });
  } catch (err) {
    if (err instanceof CourseAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
