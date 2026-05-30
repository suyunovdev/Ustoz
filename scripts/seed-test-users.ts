/**
 * Test akkauntlarni yaratish — admin/teacher/student
 *
 * Foydalanish:
 *   npx tsx scripts/seed-test-users.ts
 *
 * Idempotent — takror chaqirsangiz parol qayta hash qilinadi va yangilanadi.
 */

import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const PASSWORD = 'Test1234!';

const users = [
  {
    email: 'admin@ustoz.uz',
    fullName: 'Admin Akkaunti',
    role: 'admin' as const,
  },
  {
    email: 'teacher@ustoz.uz',
    fullName: 'Ustoz Test',
    role: 'teacher' as const,
  },
  {
    email: 'student@ustoz.uz',
    fullName: 'Talaba Test',
    role: 'student' as const,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        passwordHash,
        role: u.role,
        profile: {
          create: {
            email: u.email,
            fullName: u.fullName,
            role: u.role,
          },
        },
      },
      update: {
        passwordHash,
        role: u.role,
        profile: {
          upsert: {
            create: { email: u.email, fullName: u.fullName, role: u.role },
            update: { fullName: u.fullName, role: u.role },
          },
        },
      },
      include: { profile: true },
    });
    console.log(`✓ ${u.role.padEnd(8)} ${user.email}  (${user.profile?.fullName})`);
  }

  console.log(`\nParol (3 ta akkaunt uchun ham): ${PASSWORD}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
