/**
 * Backfill: mavjud aktiv obuna egalariga "Obunangiz faollashtirildi" bildirishnomasi.
 * (Ilgari obuna faollashuvida bildirishnoma yaratilmasdi.) Idempotent — shu sarlavhali
 * bildirishnoma bo'lsa qayta yaratmaydi.
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const subs = await prisma.subscription.findMany({
    where: { status: 'active' },
    include: { plan: { select: { name: true } } },
  });
  console.log('Aktiv obunalar:', subs.length);
  let created = 0, skipped = 0;
  for (const s of subs) {
    const exists = await prisma.notification.count({
      where: { recipientId: s.userId, title: 'Obunangiz faollashtirildi' },
    });
    if (exists > 0) { skipped++; continue; }
    await prisma.notification.create({
      data: {
        recipientId: s.userId,
        type: 'payment',
        title: 'Obunangiz faollashtirildi',
        message: `"${s.plan?.name ?? 'Obuna'}" obunasi faollashtirildi. Endi barcha kurslardan foydalanishingiz mumkin.`,
        status: 'unread',
        metadata: { kind: 'subscription', source: 'backfill' },
        createdAt: s.createdAt,
      },
    });
    created++;
    console.log(`✅ ${s.userId} — ${s.plan?.name}`);
  }
  console.log(`\nYaratilgan: ${created} | O'tkazilgan: ${skipped}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
