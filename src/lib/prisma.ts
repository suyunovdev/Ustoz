import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Pool sozlamalari — cold-start va yuklama barqarorligi uchun. Ilgari standart
  // (cheksiz) pool edi; DB'ni bosib qo'yishi yoki ulanish kutishida osilib qolishi
  // mumkin edi. max — bitta Node jarayoni uchun xavfsiz chegara.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

// Production'da ham global cache'da saqlash — cold start'da qayta yaratilmaydi
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
