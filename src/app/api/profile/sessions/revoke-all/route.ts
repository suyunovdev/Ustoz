/**
 * POST /api/profile/sessions/revoke-all — barcha qurilmalardan chiqish.
 * tokenVersion inkrementi → mavjud barcha JWT sessiyalar (shu jumladan joriy) bekor.
 * Client javobdan keyin login sahifasiga yo'naltiriladi.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    await prisma.user.update({
      where: { id: session.sub },
      data: { tokenVersion: { increment: 1 } },
    });
    return jsonResponse({ success: true }, { headers: { 'Set-Cookie': clearSessionCookie() } });
  } catch (err) {
    return errorResponse(err);
  }
}
