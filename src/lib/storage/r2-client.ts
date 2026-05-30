/**
 * Cloudflare R2 storage client (S3-compatible).
 *
 * Env vars (hammasi to'ldirilgan bo'lsa, R2 ishlaydi):
 *   R2_ACCOUNT_ID         — Cloudflare account id
 *   R2_ACCESS_KEY_ID      — R2 API token access key
 *   R2_SECRET_ACCESS_KEY  — R2 API token secret
 *   R2_BUCKET             — Bucket nomi
 *   R2_PUBLIC_URL         — (ixtiyoriy) public CDN URL prefix, masalan https://cdn.ustoz.uz
 *
 * Agar biror env yo'q bo'lsa, isR2Configured() false qaytaradi va API'lar 503 beradi.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'node:crypto';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || '';
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const BUCKET = process.env.R2_BUCKET || '';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

const MAX_FILE_SIZE = 500 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  // Image
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  // Document
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
]);

export function isR2Configured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY && SECRET_KEY && BUCKET);
}

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    });
  }
  return _client;
}

export interface PresignedUploadInput {
  teacherId: string;
  topicId: string;
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  r2Key: string;
  expiresInSec: number;
}

export class R2ValidationError extends Error {
  code = 'R2_VALIDATION_ERROR';
}

export async function createPresignedUpload(
  input: PresignedUploadInput,
): Promise<PresignedUploadResult> {
  if (!isR2Configured()) {
    throw new Error('R2_NOT_CONFIGURED');
  }
  if (input.fileSize <= 0 || input.fileSize > MAX_FILE_SIZE) {
    throw new R2ValidationError(`Fayl hajmi 0–${MAX_FILE_SIZE / 1024 / 1024}MB orasida bo'lishi kerak`);
  }
  if (!ALLOWED_MIME.has(input.contentType)) {
    throw new R2ValidationError(`Bu MIME type qabul qilinmaydi: ${input.contentType}`);
  }
  const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  const r2Key = `materials/${input.teacherId}/${input.topicId}/${Date.now()}-${randomBytes(4).toString('hex')}-${sanitizedName}`;

  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: r2Key,
    ContentType: input.contentType,
    ContentLength: input.fileSize,
  });

  const expiresInSec = 600;
  const uploadUrl = await getSignedUrl(getClient(), cmd, { expiresIn: expiresInSec });
  const publicUrl = PUBLIC_URL
    ? `${PUBLIC_URL.replace(/\/$/, '')}/${r2Key}`
    : `https://${BUCKET}.${ACCOUNT_ID}.r2.cloudflarestorage.com/${r2Key}`;

  return { uploadUrl, publicUrl, r2Key, expiresInSec };
}

export async function deleteR2Object(r2Key: string): Promise<void> {
  if (!isR2Configured()) return;
  await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: r2Key }));
}
