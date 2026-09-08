/**
 * Bunny Stream client — himoyalangan dars videolari uchun.
 *
 * Konfiguratsiya (Library ID, API Key, Token Key) admin panelidan (DB) yoki
 * env'dan olinadi — `platform-settings.service.getBunnyConfig()` orqali
 * (avval DB, bo'lmasa BUNNY_STREAM_* env). Admin kalitlarni istalgan payt
 * UI'dan almashtira oladi (redeploy shart emas).
 *
 * Xavfsizlik: video kutubxonada "Token Authentication" + "Allowed Referrers"
 * (domen qulfi) yoqilgan bo'lishi kerak — shunda tokensiz yoki begona domendan
 * ochib bo'lmaydi. DRM (MediaCage) kerak bo'lsa Bunny panelidan yoqiladi.
 */

import { createHash } from 'node:crypto';
import { getBunnyConfig } from '@/lib/services/platform-settings.service';

const MGMT_BASE = 'https://video.bunnycdn.com';
const TUS_ENDPOINT = 'https://video.bunnycdn.com/tusupload';
const EMBED_HOST = 'https://iframe.mediadelivery.net';

export async function isBunnyConfigured(): Promise<boolean> {
  const c = await getBunnyConfig();
  return Boolean(c.libraryId && c.apiKey);
}

export async function isBunnySigningConfigured(): Promise<boolean> {
  const c = await getBunnyConfig();
  return Boolean(c.libraryId && c.tokenKey);
}

export class BunnyError extends Error {
  code = 'BUNNY_ERROR';
}

function sha256hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Bunny'da video obyektini yaratadi (yuklashdan oldin) — GUID qaytaradi. */
async function createVideo(libraryId: string, apiKey: string, title: string): Promise<string> {
  const res = await fetch(`${MGMT_BASE}/library/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const json = (await res.json().catch(() => null)) as { guid?: string } | null;
  if (!res.ok || !json?.guid) {
    throw new BunnyError(`Bunny video yaratish xatosi (${res.status})`);
  }
  return json.guid;
}

export interface TusUploadResult {
  videoGuid: string;
  libraryId: string;
  endpoint: string;
  authorizationSignature: string;
  authorizationExpire: number; // unix sekund
}

/**
 * TUS (resumable) yuklash uchun imzolangan parametrlar. Client tus-js-client bilan
 * to'g'ridan-to'g'ri Bunny'ga yuklaydi — katta fayl bizning serverdan o'tmaydi,
 * API kaliti clientga chiqmaydi (faqat imzo).
 *
 * Imzo: sha256_hex(libraryId + apiKey + expire + videoId).
 */
export async function createTusUpload(title: string): Promise<TusUploadResult> {
  const { libraryId, apiKey } = await getBunnyConfig();
  if (!libraryId || !apiKey) throw new BunnyError('BUNNY_NOT_CONFIGURED');
  const videoGuid = await createVideo(libraryId, apiKey, title || 'Dars videosi');
  const expire = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 soat
  const authorizationSignature = sha256hex(`${libraryId}${apiKey}${expire}${videoGuid}`);
  return {
    videoGuid,
    libraryId,
    endpoint: TUS_ENDPOINT,
    authorizationSignature,
    authorizationExpire: expire,
  };
}

export interface SignedEmbed {
  embedUrl: string;
  expires: number; // unix sekund
}

/**
 * Imzolangan embed URL — faqat kirish huquqi tasdiqlangandan keyin.
 * token = sha256_hex(tokenKey + videoGuid + expires).
 */
export async function signEmbedUrl(videoGuid: string, expSeconds = 2 * 60 * 60): Promise<SignedEmbed> {
  const { libraryId, tokenKey } = await getBunnyConfig();
  if (!libraryId || !tokenKey) throw new BunnyError('BUNNY_SIGNING_NOT_CONFIGURED');
  const expires = Math.floor(Date.now() / 1000) + expSeconds;
  const token = sha256hex(`${tokenKey}${videoGuid}${expires}`);
  const embedUrl = `${EMBED_HOST}/embed/${libraryId}/${videoGuid}?token=${token}&expires=${expires}&autoplay=false&preload=false`;
  return { embedUrl, expires };
}

export interface VideoStatus {
  /** Bunny status kodi: 0 created,1 uploaded,2 processing,3 transcoding,4 finished,5 error,6 upload-failed */
  status: number;
  ready: boolean;
  failed: boolean;
}

/** Bunny video holati — yuklashdan keyin qayta ishlash tugaganini kuzatish uchun. */
export async function getVideoStatus(videoGuid: string): Promise<VideoStatus> {
  const { libraryId, apiKey } = await getBunnyConfig();
  if (!libraryId || !apiKey) throw new BunnyError('BUNNY_NOT_CONFIGURED');
  const res = await fetch(`${MGMT_BASE}/library/${libraryId}/videos/${videoGuid}`, {
    headers: { AccessKey: apiKey, Accept: 'application/json' },
  });
  const json = (await res.json().catch(() => null)) as { status?: number } | null;
  if (!res.ok || json?.status === undefined) {
    throw new BunnyError(`Bunny video holati xatosi (${res.status})`);
  }
  const status = Number(json.status);
  return { status, ready: status === 4, failed: status === 5 || status === 6 };
}

/** Teacher video almashtirsa yoki topic o'chsa — Bunny'dan ham o'chiramiz (best-effort). */
export async function deleteBunnyVideo(videoGuid: string): Promise<void> {
  if (!videoGuid) return;
  const { libraryId, apiKey } = await getBunnyConfig();
  if (!libraryId || !apiKey) return;
  await fetch(`${MGMT_BASE}/library/${libraryId}/videos/${videoGuid}`, {
    method: 'DELETE',
    headers: { AccessKey: apiKey },
  }).catch(() => {
    /* best-effort */
  });
}
