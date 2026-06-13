/**
 * GET /api/review-templates
 * Sharh shablonlari ro'yxati (public, static).
 *
 * Response: { templates: { [rating]: [{ id, text }] } }
 */

import { jsonResponse } from '@/lib/json';
import { REVIEW_TEMPLATES } from '@/lib/data/review-templates';

export async function GET() {
  return jsonResponse({ templates: REVIEW_TEMPLATES });
}
