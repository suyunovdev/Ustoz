import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

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
  // Dev rejimda barqaror, lekin hardcoded bo'lmagan kalit ishlatamiz.
  // Eslatma: bu faqat lokal development uchun.
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] JWT_SECRET o\'rnatilmagan — dev fallback kalit ishlatilmoqda. ' +
      'Production uchun JWT_SECRET (>=32 belgi) sozlang.',
  );
  return new TextEncoder().encode('dev-only-insecure-secret-do-not-use-in-prod');
}

const JWT_SECRET = resolveJwtSecret();

export const COOKIE_NAME = 'ustoz_session';

export interface JWTPayload {
  sub: string;    // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Token yaratish
export async function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

// Token tekshirish
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    // JWT verification failure (expired, malformed, wrong signature) is expected — return null
    return null;
  }
}

// Cookie dan foydalanuvchini olish (Server Component / Route Handler uchun)
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Request dan foydalanuvchini olish (API route uchun)
export async function getSessionFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Session cookie yaratish (Response headers uchun)
export function createSessionCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  // Secure flag faqat HTTPS mavjud bo'lganda (APP_URL https:// bilan boshlansa)
  const useSecure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${useSecure ? '; Secure' : ''}`;
}

// Session cookie o'chirish
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
