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

  const headResp = await fetch(url, { method: 'HEAD' }).catch(() => null);
  if (headResp && headResp.ok) {
    const lenHeader = headResp.headers.get('content-length');
    if (lenHeader) {
      const len = Number(lenHeader);
      if (len > MAX_FILE_SIZE) {
        throw new WhisperSizeError(`Fayl 25 MB'dan katta (${(len / 1024 / 1024).toFixed(1)} MB)`);
      }
    }
  }

  const fileResp = await fetch(url);
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
