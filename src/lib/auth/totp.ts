/**
 * TOTP (RFC 6238) — tashqi kutubxonasiz, node:crypto asosida.
 * HMAC-SHA1, 30s qadam, 6 raqam. Google Authenticator / Authy bilan mos.
 */
import {
  createHmac,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** Yangi TOTP maxfiy kaliti (base32, 20 bayt). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** Berilgan vaqt qadami uchun 6 raqamli kod. */
export function generateTotp(secret: string, forTime = Date.now(), step = 30): string {
  const counter = Math.floor(forTime / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

/** Kodni tekshiradi (±1 qadam oyna — soat sal og'ishiga bardosh). */
export function verifyTotp(secret: string, token: string, step = 30): boolean {
  const clean = (token || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const now = Date.now();
  for (const delta of [-1, 0, 1]) {
    if (generateTotp(secret, now + delta * step * 1000, step) === clean) return true;
  }
  return false;
}

/** Authenticator ilovasi uchun otpauth:// URL. */
export function otpauthUrl(secret: string, account: string, issuer = 'Ustoz'): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({ secret, issuer, algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Zaxira kodlar (bir martalik). Har biri 10 bayt (80 bit) entropiya —
 * 20 hex belgi, o'qishga qulay bo'lishi uchun 2 guruhga bo'linadi.
 * Eslatma: kodlar chaqiruvchi tomonda bcrypt bilan hashlanib saqlanadi.
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const hex = randomBytes(10).toString('hex'); // 20 hex belgi
    codes.push(`${hex.slice(0, 10)}-${hex.slice(10)}`);
  }
  return codes;
}

/**
 * TOTP maxfiy kalitini at-rest shifrlash uchun AEAD (AES-256-GCM).
 * Kalit TOTP_ENC_KEY env'dan (32-baytlik base64) olinadi.
 * Format: `v1:${iv_b64}:${tag_b64}:${ct_b64}`.
 */
const ENC_PREFIX = 'v1:';

function getEncKey(): Buffer | null {
  const raw = process.env.TOTP_ENC_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    console.warn('[2FA] TOTP_ENC_KEY 32 bayt (base64) bo\'lishi kerak — shifrlash o\'tkazib yuborildi');
    return null;
  }
  return key;
}

/** Shifrlangan qiymat ekanligini tekshiradi. */
export function isEncryptedSecret(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/**
 * Maxfiy kalitni shifrlaydi. TOTP_ENC_KEY o'rnatilmagan bo'lsa — plaintext
 * qaytaradi (hozirgi xatti-harakat) va ogohlantiradi. Prod'ni buzmaydi.
 */
export function encryptSecret(plain: string): string {
  const key = getEncKey();
  if (!key) {
    console.warn('[2FA] TOTP_ENC_KEY o\'rnatilmagan — totpSecret plaintext saqlanadi');
    return plain;
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${ENC_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

/**
 * Maxfiy kalitni deshifrlaydi. 'v1:' bilan boshlanmasa — plaintext deb
 * qabul qiladi (lazy migratsiya: mavjud userlar buzilmaydi).
 */
export function decryptSecret(stored: string): string {
  if (!isEncryptedSecret(stored)) return stored; // eski plaintext
  const key = getEncKey();
  if (!key) {
    throw new Error('[2FA] Shifrlangan totpSecret bor, lekin TOTP_ENC_KEY yo\'q');
  }
  const [, ivB64, tagB64, ctB64] = stored.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
