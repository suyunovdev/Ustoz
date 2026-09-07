/**
 * Resend client wrapper — qayta ishlatish uchun.
 *
 * Environment:
 *   RESEND_API_KEY — Bearer token
 *   RESEND_FROM    — 'Ustoz <no-reply@your-domain.com>' (yo'q bo'lsa sandbox)
 *
 * Batching: Resend rate limit ~5 req/s. Standart: 3 concurrent + 700ms pauza
 * (~4 req/s) — limitdan past turadi, "Too many requests" xatosini oldini oladi.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Xom Resend xatolarini foydalanuvchiga tushunarli qisqa matnga o'giradi (UI'ga xom
// provayder matni to'kilmasin). Noma'lum xatolar qisqartiriladi.
export function friendlyEmailError(raw: string | undefined): string {
  if (!raw) return 'Yuborilmadi';
  const s = raw.toLowerCase();
  if (s.includes('testing emails') || s.includes('verify a domain')) {
    return 'Domen tasdiqlanmagan — faqat egalik qilingan pochtaga yuborish mumkin (RESEND_FROM sozlang)';
  }
  if (s.includes('too many requests') || s.includes('rate')) {
    return 'So‘rovlar ko‘p — biroz keyin qayta urinib ko‘ring';
  }
  if (s.includes('not configured') || s.includes('api_key') || s.includes('api key')) {
    return 'Email xizmati sozlanmagan (RESEND_API_KEY yo‘q)';
  }
  if (s.includes('invalid') && s.includes('email')) return 'Email manzili noto‘g‘ri';
  return raw.length > 80 ? raw.slice(0, 77) + '…' : raw;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  to: string;
  success: boolean;
  error?: string;
  id?: string;
}

function isConfigured(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && !key.startsWith('your-'));
}

function getFromAddress(): string {
  return process.env.RESEND_FROM || 'Ustoz <onboarding@resend.dev>';
}

export async function sendOne(input: SendEmailInput): Promise<SendResult> {
  if (!isConfigured()) {
    return { to: input.to, success: false, error: 'RESEND_API_KEY not configured' };
  }
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        to: input.to,
        success: false,
        error: body?.message ?? `HTTP ${res.status}`,
      };
    }
    return { to: input.to, success: true, id: body?.id };
  } catch (err) {
    return {
      to: input.to,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

interface BatchOptions {
  concurrency?: number;       // default 10
  throttleMs?: number;        // batches orasidagi pauza
  onProgress?: (done: number, total: number) => void;
}

/**
 * Email'larni partiyalarga bo'lib jo'natadi.
 * Hech qanday Promise reject qilmaydi — har email natijasi alohida qaytariladi.
 */
export async function sendBatch(
  inputs: SendEmailInput[],
  options: BatchOptions = {},
): Promise<SendResult[]> {
  // Standart 3 concurrent + 700ms pauza (~4 req/s) — Resend ~5 req/s limitidan past
  const { concurrency = 3, throttleMs = 700, onProgress } = options;
  const results: SendResult[] = [];
  let done = 0;

  for (let i = 0; i < inputs.length; i += concurrency) {
    const chunk = inputs.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(sendOne));
    results.push(...chunkResults);
    done += chunk.length;
    onProgress?.(done, inputs.length);
    if (i + concurrency < inputs.length && throttleMs > 0) {
      await new Promise((r) => setTimeout(r, throttleMs));
    }
  }
  return results;
}

export function isResendConfigured(): boolean {
  return isConfigured();
}
