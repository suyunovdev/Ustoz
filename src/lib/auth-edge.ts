// Edge runtime uchun xavfsiz auth utilities (next/headers ishlatilmaydi)
import { jwtVerify } from 'jose';

function resolveJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (raw && raw.length >= 32) {
    return new TextEncoder().encode(raw);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET muhit o\'zgaruvchisi o\'rnatilmagan yoki juda qisqa (kamida 32 belgi). ' +
        'Production muhit uchun majburiy.',
    );
  }
  return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-prod');
}

const JWT_SECRET = resolveJwtSecret();

export const COOKIE_NAME = 'ustoz_session';

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
