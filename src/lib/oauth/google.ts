/**
 * Google OAuth 2.0 — Supabase'siz, to'g'ridan-to'g'ri (Authorization Code flow).
 * JWT + Postgres auth tizimiga integratsiya uchun yordamchilar.
 *
 * Kerakli env:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   (ixtiyoriy) GOOGLE_REDIRECT_URI — aks holda NEXT_PUBLIC_APP_URL + /auth/callback
 */

// CSRF state cookie nomi (route fayllaridan eksport qilib bo'lmaydi — shu yerda)
export const OAUTH_STATE_COOKIE = 'g_oauth_state';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Ilovaning PUBLIC bazaviy URL'i (nginx orqasida req.url ichki localhost:4028
 * bo'lib qoladi — shuning uchun redirect'lar buni EMAS, NEXT_PUBLIC_APP_URL'ni
 * ishlatishi shart, aks holda foydalanuvchi localhost'ga tashlanadi).
 */
export function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4028').replace(/\/$/, '');
}

/** Public absolute URL: getAppBaseUrl() + path. */
export function appUrl(path: string): string {
  return `${getAppBaseUrl()}${path}`;
}

export function getRedirectUri(): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  return `${getAppBaseUrl()}/auth/callback`;
}

/** Google roziligi (consent) sahifasiga yo'naltirish URL'i. */
export function buildGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token?: string;
  id_token?: string;
  error?: string;
}

/** Authorization code'ni access token'ga almashtiradi. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID as string,
      client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  const data = (await res.json()) as GoogleTokenResponse;
  if (!res.ok || !data.access_token) {
    throw new Error(`Google token almashtirish xatosi: ${data.error || res.status}`);
  }
  return data.access_token;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
}

/** Access token bilan foydalanuvchi ma'lumotini oladi. */
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google userinfo xatosi: ${res.status}`);
  const d = (await res.json()) as Record<string, unknown>;
  // email_verified Google'da boolean yoki "true" string bo'lishi mumkin.
  const emailVerified = d.email_verified === true || d.email_verified === 'true';
  return {
    sub: String(d.sub || ''),
    email: String(d.email || ''),
    emailVerified,
    name: d.name ? String(d.name) : null,
    picture: d.picture ? String(d.picture) : null,
  };
}
