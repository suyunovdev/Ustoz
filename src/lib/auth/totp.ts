/**
 * TOTP (RFC 6238) — tashqi kutubxonasiz, node:crypto asosida.
 * HMAC-SHA1, 30s qadam, 6 raqam. Google Authenticator / Authy bilan mos.
 */
import { createHmac, randomBytes } from 'node:crypto';

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

/** Zaxira kodlar (bir martalik). */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(randomBytes(4).toString('hex')); // 8 hex belgi
  }
  return codes;
}
