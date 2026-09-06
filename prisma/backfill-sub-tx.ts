/**
 * Backfill: mavjud obunalar uchun to'lov tarixida yozuv yo'q edi
 * (grantSubscriptionManually ilgari PaymentTransaction yaratmasdi).
 * Har bir AKTIV obuna egasi uchun, agar unda birorta 'subscription' turidagi
 * tranzaksiya bo'lmasa — bittasini yaratamiz (status='completed', plan narxi).
 * Idempotent: qayta ishlatilganda dublikat yaratmaydi.
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const subs = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: { plan: { select: { id: true, name: true, priceUzs: true } } },
    orderBy: { createdAt: 'asc' },
  });
  console.log('Aktiv obunalar:', subs.length);

  let created = 0, skipped = 0;
  for (const s of subs) {
    if (!s.plan) { skipped++; continue; }
    const existing = await prisma.paymentTransaction.count({
      where: { studentId: s.userId, kind: 'subscription' },
    });
    if (existing > 0) { skipped++; continue; }

    await prisma.paymentTransaction.create({
      data: {
        studentId: s.userId,
        kind: 'subscription',
        planId: s.plan.id,
        amountUzs: s.plan.priceUzs,
        currency: 'UZS',
        paymentMethod: 'click',
        status: 'completed',
        completedAt: s.createdAt,
        createdAt: s.createdAt,
        metadata: { source: 'backfill', planName: s.plan.name },
      },
    });
    created++;
    console.log(`✅ ${s.userId} — ${s.plan.name}`);
  }
  console.log(`\nYaratilgan: ${created} | O'tkazilgan: ${skipped}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
