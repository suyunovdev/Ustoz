/**
 * Resend client wrapper — qayta ishlatish uchun.
 *
 * Environment:
 *   RESEND_API_KEY — Bearer token
 *   RESEND_FROM    — 'Ustoz <no-reply@your-domain.com>' (yo'q bo'lsa sandbox)
 *
 * Batching: 10 ta concurrent + 100ms throttle (Resend rate limit ~2 req/s sandbox'da)
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

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
  const { concurrency = 10, throttleMs = 100, onProgress } = options;
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
