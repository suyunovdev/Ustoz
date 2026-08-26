/**
 * Video manba turini aniqlash va xavfsiz embed URL qurish.
 *
 * Qo'llab-quvvatlanadi:
 *   - YouTube      → iframe embed (youtube.com/watch, youtu.be, /embed, /shorts)
 *   - Vimeo        → iframe embed (vimeo.com/{id}, player.vimeo.com/video/{id})
 *   - Cloudflare Stream → iframe embed (customer-*.cloudflarestream.com/.../iframe)
 *   - To'g'ridan-to'g'ri fayl (mp4/webm/... yoki R2) → HTML5 <video>
 *
 * Barcha ID'lar sanitizatsiya qilinadi (faqat [A-Za-z0-9_-]) — XSS/embed-injection'dan himoya.
 */

export type VideoKind = 'youtube' | 'vimeo' | 'cloudflare' | 'file' | 'none' | 'unknown';

export interface VideoSource {
  kind: VideoKind;
  /** iframe uchun embed manzili (youtube/vimeo/cloudflare) */
  embedUrl?: string;
  /** HTML5 <video> uchun bevosita fayl manzili */
  fileUrl?: string;
  /** manba identifikatori (diagnostika uchun) */
  id?: string;
}

const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;
const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i;

function safeUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim());
  } catch {
    return null;
  }
}

function extractYouTubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    return u.pathname.slice(1).split('/')[0] || null;
  }
  if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    // /watch?v=ID
    const v = u.searchParams.get('v');
    if (v) return v;
    // /embed/ID  yoki  /shorts/ID  yoki  /v/ID
    const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?#]+)/);
    if (m) return m[1];
  }
  return null;
}

/**
 * Kirish URL'idan video manbani aniqlaydi. Hech qachon exception tashlamaydi.
 */
export function parseVideoSource(rawUrl: string | null | undefined): VideoSource {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { kind: 'none' };
  }
  const raw = rawUrl.trim();
  const u = safeUrl(raw);

  // Nisbiy yo'l (masalan /uploads/dars.mp4) — fayl deb qaraymiz
  if (!u) {
    if (raw.startsWith('/') && VIDEO_EXT.test(raw)) {
      return { kind: 'file', fileUrl: raw };
    }
    return { kind: 'unknown' };
  }

  // Faqat http(s) — javascript:, data: va boshqalarni rad etamiz
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    return { kind: 'unknown' };
  }

  const host = u.hostname.replace(/^www\./, '');

  // YouTube
  if (host === 'youtu.be' || host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
    const id = extractYouTubeId(u);
    if (id && YT_ID.test(id)) {
      const embedUrl = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
      return { kind: 'youtube', embedUrl, id };
    }
    return { kind: 'unknown' };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(\d{6,})/);
    if (m) {
      return { kind: 'vimeo', embedUrl: `https://player.vimeo.com/video/${m[1]}`, id: m[1] };
    }
    return { kind: 'unknown' };
  }

  // Cloudflare Stream — customer-*.cloudflarestream.com (CSP frame-src ruxsati)
  if (host.endsWith('cloudflarestream.com')) {
    // Allaqachon /iframe bo'lsa o'zini, aks holda /iframe qo'shamiz
    const idMatch = u.pathname.match(/^\/([A-Za-z0-9]+)/);
    if (idMatch) {
      const base = `${u.origin}/${idMatch[1]}`;
      const embedUrl = u.pathname.includes('/iframe') ? `${u.origin}${u.pathname}` : `${base}/iframe`;
      return { kind: 'cloudflare', embedUrl, id: idMatch[1] };
    }
    return { kind: 'unknown' };
  }

  // To'g'ridan-to'g'ri fayl: kengaytma bo'yicha yoki R2 host bo'yicha
  const isR2 = host.endsWith('r2.cloudflarestorage.com') || host.endsWith('r2.dev');
  if (VIDEO_EXT.test(u.pathname) || isR2) {
    return { kind: 'file', fileUrl: u.toString() };
  }

  return { kind: 'unknown' };
}

/** iframe orqali o'ynatiladigan manbami (o'z boshqaruvlari bilan) */
export function isEmbedKind(kind: VideoKind): boolean {
  return kind === 'youtube' || kind === 'vimeo' || kind === 'cloudflare';
}
