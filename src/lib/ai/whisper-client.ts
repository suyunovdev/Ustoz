/**
 * OpenAI Whisper (audio transcription) wrapper.
 *
 * Env: OPENAI_API_KEY
 * Model: whisper-1 (eng arzon, eng mashhur)
 *
 * Whisper to'g'ridan-to'g'ri URL'dan transkripsiya qila olmaydi —
 * audio/video faylni multipart/form-data sifatida jo'natish kerak.
 * Shu sabab API faylni URL'dan yuklab oladi, keyin OpenAI'ga forward qiladi.
 *
 * Cheklovlar:
 *   - Fayl o'lchami < 25 MB (Whisper limit)
 *   - YouTube/Vimeo URL'lar ishlamaydi (yt-dlp kerak — kelajak iteratsiyada)
 *   - To'g'ridan-to'g'ri .mp3/.mp4/.wav/.m4a/.webm URL'lar uchun ishlaydi
 */

import { lookup as dnsLookup } from 'node:dns/promises';
import { Agent, fetch as undiciFetch } from 'undici';

const ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions';
const MODEL = 'whisper-1';
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function isOpenAIConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key.length > 10 && !key.startsWith('your-'));
}

export interface TranscribeResult {
  text: string;
  language?: string;
  durationSec?: number;
}

export class WhisperFetchError extends Error {
  code = 'WHISPER_FETCH_FAILED';
}

export class WhisperSizeError extends Error {
  code = 'WHISPER_FILE_TOO_LARGE';
}

const SUPPORTED_HOSTS_BLOCKED = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'vimeo.com',
  'www.vimeo.com',
]);

export class WhisperUrlError extends Error {
  code = 'WHISPER_URL_REJECTED';
}

/**
 * IPv4 literal (masalan "10.0.0.5") private/loopback/link-level ekanini aniqlaydi.
 * IPv4 bo'lmasa null qaytaradi (tekshirish uchun literal emas).
 */
function isPrivateIPv4(host: string): boolean | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!m) return null;
  const oct = m.slice(1).map(Number);
  if (oct.some((n) => n > 255)) return true; // yaroqsiz IPv4 → xavfsizlik uchun rad
  const [a, b] = oct;
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local
  if (a === 0) return true; // 0.0.0.0/8
  return false;
}

/** Yechilgan IP (v4/v6) public (internetga ochiq) ekanini tekshiradi. */
function isPublicIp(address: string, family: number): boolean {
  if (family === 4) return isPrivateIPv4(address) === false;
  // IPv6: loopback / ULA (fc00::/7) / link-local (fe80::/10) / IPv4-mapped — rad.
  const h = address.toLowerCase();
  if (h === '::1' || /^f[cd]/.test(h) || /^fe[89ab]/.test(h) || h.startsWith('::ffff:')) return false;
  return true;
}

/**
 * Host'ni DNS orqali HOZIR yechib, barcha IP'lar public ekanini tekshiradi va birinchi
 * public IP'ni qaytaradi (fetch shu IP'ga PIN qilinadi). Bu DNS-rebinding'ni yopadi:
 * tekshiruvdan keyin fetch qayta yechib ichki IP'ga sakramaydi. IP-literal host uchun
 * (allaqachon assertSafeFetchUrl tekshirgan) null qaytaradi — pin shart emas.
 */
async function resolvePinnedIp(host: string): Promise<{ address: string; family: number } | null> {
  // IP-literal (dotted-quad yoki IPv6) — DNS yechish shart emas.
  if (isPrivateIPv4(host) !== null || host.includes(':')) return null;
  const records = await dnsLookup(host, { all: true }).catch(() => [] as Array<{ address: string; family: number }>);
  if (!records.length) throw new WhisperFetchError('Host DNS orqali yechilmadi');
  for (const r of records) {
    if (!isPublicIp(r.address, r.family)) {
      throw new WhisperUrlError('Host ichki IP manzilga yechildi (SSRF taqiqlangan)');
    }
  }
  return { address: records[0].address, family: records[0].family };
}

/**
 * SSRF himoyasi: server user-controlled URL'ni yuklab olishdan OLDIN tekshiradi.
 *   - faqat https: protokol
 *   - loopback / private / link-local hostlar bloklanadi
 *   - R2_PUBLIC_URL sozlangan bo'lsa — faqat o'sha hostga ruxsat (allowlist)
 * Rad etilsa WhisperUrlError tashlaydi.
 */
function assertSafeFetchUrl(parsed: URL): void {
  if (parsed.protocol !== 'https:') {
    throw new WhisperUrlError("Faqat https: URL'lar qo'llab-quvvatlanadi");
  }

  const host = parsed.hostname.toLowerCase();

  if (host === 'localhost' || host === '::1' || host === '[::1]' || host === '0.0.0.0') {
    throw new WhisperUrlError("Ichki (loopback) manzillar taqiqlangan");
  }

  // Hex-literal (0x7f000001) — bypass, rad et.
  if (/^0x/i.test(host)) {
    throw new WhisperUrlError("Hex IP-literal hostlar taqiqlangan");
  }

  // Sof-raqamli/nuqtali host (masalan 2130706433 decimal, 0177.0.0.1 oktal) —
  // agar standart dotted-quad bo'lmasa noaniq IP-literal, SSRF bypass ehtimoli. Rad et.
  if (/^[0-9.]+$/.test(host) && isPrivateIPv4(host) === null) {
    throw new WhisperUrlError("Noaniq IP-literal host taqiqlangan");
  }

  const privateV4 = isPrivateIPv4(host);
  if (privateV4 === true) {
    throw new WhisperUrlError("Ichki (private/loopback) IP manzillar taqiqlangan");
  }

  // IPv6 literal loopback/ULA(fc00::/7)/link-local(fe80::/10) — bracketli yoki xom.
  if (host.includes(':')) {
    const h6 = host.replace(/^\[|\]$/g, '');
    if (h6 === '::1' || /^f[cd]/.test(h6) || /^fe[89ab]/.test(h6) || /^::ffff:/.test(h6)) {
      throw new WhisperUrlError("Ichki IPv6 manzillar taqiqlangan");
    }
  }

  // Ixtiyoriy allowlist: R2 public host sozlangan bo'lsa, faqat o'sha hostga ruxsat.
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    let allowedHost = '';
    try {
      allowedHost = new URL(publicUrl).hostname.toLowerCase();
    } catch {
      allowedHost = '';
    }
    if (allowedHost && host !== allowedHost) {
      throw new WhisperUrlError("Bu manbadan yuklab olishga ruxsat yo'q");
    }
  }
}

export async function transcribeFromUrl(
  url: string,
  options: { language?: string } = {},
): Promise<TranscribeResult> {
  if (!isOpenAIConfigured()) {
    throw new Error('OPENAI_API_KEY environment\'da sozlanmagan');
  }

  const parsed = new URL(url);
  if (SUPPORTED_HOSTS_BLOCKED.has(parsed.hostname)) {
    throw new WhisperFetchError(
      'YouTube/Vimeo URL\'lar qo\'llab-quvvatlanmaydi. To\'g\'ridan-to\'g\'ri audio/video URL\'i kerak.',
    );
  }

  // SSRF himoyasi — har qanday fetch'dan OLDIN URL'ni tekshir.
  assertSafeFetchUrl(parsed);

  // DNS-rebinding himoyasi: host'ni HOZIR yechib, IP'ni pin qilamiz — fetch aynan shu
  // (tekshirilgan public) IP'ga ulanadi, qayta yechmaydi. TLS SNI hostname bo'yicha qoladi.
  const pinned = await resolvePinnedIp(parsed.hostname.toLowerCase());
  const dispatcher = pinned
    ? new Agent({
        connect: {
          lookup: ((_hostname: string, _options: unknown, cb: (err: Error | null, address: string, family: number) => void) => {
            cb(null, pinned.address, pinned.family);
          }) as never,
        },
      })
    : undefined;
  const fetchOpts = dispatcher ? { dispatcher } : {};

  // redirect: 'error' — 3xx orqali ichki hostga (SSRF) sakrashni bloklaydi:
  // boshlang'ich URL xavfsiz bo'lsa-da, redirect ichki manzilga olib borishi mumkin edi.
  const headResp = await undiciFetch(url, { method: 'HEAD', redirect: 'error', ...fetchOpts }).catch(() => null);
  if (headResp && headResp.ok) {
    const lenHeader = headResp.headers.get('content-length');
    if (lenHeader) {
      const len = Number(lenHeader);
      if (len > MAX_FILE_SIZE) {
        throw new WhisperSizeError(`Fayl 25 MB'dan katta (${(len / 1024 / 1024).toFixed(1)} MB)`);
      }
    }
  }

  const fileResp = await undiciFetch(url, { redirect: 'error', ...fetchOpts });
  if (!fileResp.ok) {
    throw new WhisperFetchError(`Faylni yuklab bo'lmadi: HTTP ${fileResp.status}`);
  }

  const arrayBuffer = await fileResp.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new WhisperSizeError(`Fayl 25 MB'dan katta (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
  }

  const fileName = parsed.pathname.split('/').pop() || 'audio.mp3';
  const contentType = fileResp.headers.get('content-type') || 'audio/mpeg';

  const form = new FormData();
  form.append('file', new Blob([arrayBuffer], { type: contentType }), fileName);
  form.append('model', MODEL);
  form.append('response_format', 'verbose_json');
  if (options.language) form.append('language', options.language);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as any)?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Whisper API: ${msg}`);
  }

  return {
    text: ((data as any)?.text || '').trim(),
    language: (data as any)?.language,
    durationSec: (data as any)?.duration,
  };
}
