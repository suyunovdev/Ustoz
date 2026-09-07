/**
 * E2E seed — Playwright testlari kutadigan DETERMINISTIK hisoblar.
 * Ishga tushirish: `npm run seed:e2e`
 *
 * Idempotent (upsert by email). Faqat test/dev muhitida ishlatilsin — PRODUCTION
 * DB'da ishga tushirmang (E2E_ALLOW_PROD=1 bo'lmasa prod'da to'xtaydi).
 */
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const ACCOUNTS: Array<{ email: string; password: string; fullName: string; role: 'student' | 'teacher' | 'admin' }> = [
  { email: 'test.teacher@ustoz.uz', password: 'Teacher123!', fullName: 'Test Teacher', role: 'teacher' },
  { email: 'test.student@ustoz.uz', password: 'Student123!', fullName: 'Test Student', role: 'student' },
];

async function upsertAccount(a: (typeof ACCOUNTS)[number]) {
  const email = a.email.toLowerCase();
  const passwordHash = await bcrypt.hash(a.password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        role: a.role,
        profile: {
          upsert: {
            create: { email, fullName: a.fullName, role: a.role },
            update: { fullName: a.fullName, role: a.role },
          },
        },
      },
    });
    return 'updated';
  }
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: a.role,
      profile: { create: { email, fullName: a.fullName, role: a.role } },
    },
  });
  return 'created';
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.E2E_ALLOW_PROD !== '1') {
    throw new Error('E2E seed production DB\'da ishga tushirilmaydi (E2E_ALLOW_PROD=1 majburiy)');
  }
  for (const a of ACCOUNTS) {
    const res = await upsertAccount(a);
    console.log(`[e2e-seed] ${a.email} (${a.role}) — ${res}`);
  }
}

main()
  .catch((e) => {
    console.error('[e2e-seed] xato:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
