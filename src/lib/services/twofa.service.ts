/**
 * Ikki bosqichli himoya (2FA / TOTP) xizmati.
 * Sozlash → tasdiqlash (yoqish) → login'da tekshirish → o'chirish.
 */
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import {
  generateTotpSecret,
  verifyTotp,
  otpauthUrl,
  generateBackupCodes,
} from '@/lib/auth/totp';

/** 1) Sozlash — maxfiy kalit yaratadi (hali yoqilmaydi), QR + otpauth qaytaradi. */
export async function setupTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, totpEnabled: true },
  });
  if (!user) throw new ValidationError('Foydalanuvchi topilmadi');
  if (user.totpEnabled) throw new ValidationError('2FA allaqachon yoqilgan');

  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });

  const url = otpauthUrl(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
  return { secret, otpauthUrl: url, qrDataUrl };
}

/** 2) Yoqish — kodni tekshiradi, zaxira kodlar yaratadi (ochiq holda bir marta qaytaradi). */
export async function enableTwoFactor(userId: string, token: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true },
  });
  if (!user) throw new ValidationError('Foydalanuvchi topilmadi');
  if (user.totpEnabled) throw new ValidationError('2FA allaqachon yoqilgan');
  if (!user.totpSecret) throw new ValidationError('Avval sozlashni boshlang');
  if (!verifyTotp(user.totpSecret, token)) throw new ValidationError("Noto'g'ri kod");

  const backupCodes = generateBackupCodes();
  const hashes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 10)));
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: true, totpBackupCodes: hashes },
  });
  return backupCodes;
}

/** 3) O'chirish — kod (TOTP yoki zaxira) bilan tasdiqlab o'chiradi. */
export async function disableTwoFactor(userId: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { totpSecret: true, totpEnabled: true, totpBackupCodes: true },
  });
  if (!user || !user.totpEnabled) throw new ValidationError('2FA yoqilmagan');
  const ok = await verifyTwoFactorCode(
    { id: userId, totpSecret: user.totpSecret, totpBackupCodes: user.totpBackupCodes },
    code,
  );
  if (!ok) throw new ValidationError("Noto'g'ri kod");
  await prisma.user.update({
    where: { id: userId },
    data: { totpEnabled: false, totpSecret: null, totpBackupCodes: [] },
  });
}

/**
 * Login'da: TOTP kodini yoki zaxira kodni tekshiradi. Zaxira kod ishlatilsa —
 * iste'mol qilinadi (ro'yxatdan olib tashlanadi).
 */
export async function verifyTwoFactorCode(
  user: { id: string; totpSecret: string | null; totpBackupCodes: string[] },
  code: string,
): Promise<boolean> {
  const clean = (code || '').trim();
  if (!clean) return false;
  if (user.totpSecret && verifyTotp(user.totpSecret, clean)) return true;

  // Zaxira kodlar (bir martalik)
  for (const hash of user.totpBackupCodes) {
    if (await bcrypt.compare(clean, hash)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { totpBackupCodes: user.totpBackupCodes.filter((h) => h !== hash) },
      });
      return true;
    }
  }
  return false;
}
