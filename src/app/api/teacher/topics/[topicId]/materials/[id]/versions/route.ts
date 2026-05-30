/**
 * GET /api/teacher/topics/[topicId]/materials/[id]/versions
 * Material'ning eski versiyalari ro'yxati (replace tarixi).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listMaterialVersions,
  MaterialNotFoundError,
  TopicAccessDeniedError,
} from '@/lib/services/content-material.service';

function serialize(rows: any[]) {
  return rows.map((r) => ({
    ...r,
    fileSize: r.fileSize !== null && r.fileSize !== undefined ? r.fileSize.toString() : null,
  }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const versions = await listMaterialVersions(id, session.sub);
    return jsonResponse({ versions: serialize(versions) });
  } catch (err) {
    if (err instanceof MaterialNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof TopicAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
