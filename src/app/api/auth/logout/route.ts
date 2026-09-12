import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionFromRequest } from '@/lib/auth';
import { revokeSessionByTokenId } from '@/lib/services/session.service';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Joriy sessiyani DB'da ham bekor qilamiz (best-effort).
  // Xatolik bo'lsa ham cookie baribir tozalanadi — logout hech qachon bloklanmasin.
  try {
    const session = await getSessionFromRequest(request);
    if (session?.jti) {
      await revokeSessionByTokenId(session.jti);
    }
  } catch {
    // Bekor qilishdagi xatolik logout'ni to'xtatmasligi kerak.
  }

  response.headers.set('Set-Cookie', clearSessionCookie());
  return response;
}
