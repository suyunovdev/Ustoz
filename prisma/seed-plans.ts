/**
 * Obuna rejalari — 3 tarif × (oylik+yillik) = 6 reja. Imkoniyatlar tier bo'yicha:
 *   tier 1 Boshlang'ich  — pullik kurslarga 40% chegirma (all-access YO'Q) + sertifikat
 *   tier 2 Standart      — barcha kurslar bepul + amaliy imtihon + jonli dars + AI(20/kun)
 *   tier 3 Premium       — + AI(50/kun) + ustuvor support
 * Idempotent: (tier, durationDays) bo'yicha upsert. Eski rejalar grandfather qilinadi
 * (tier=3, isActive=false) — mavjud obunachilar imkoniyatni yo'qotmaydi.
 * Global "subscriber_course_discount_pct" = 40 (Boshlang'ich chegirmasi).
 */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const F = {
  discount40: "Pullik kurslarga 40% chegirma",
  allFree: 'Barcha kurslarga bepul kirish',
  newFree: 'Yangi kurslar avtomatik qo\'shiladi',
  cert: 'Rasmiy sertifikat',
  practice: 'Amaliy imtihon banki',
  live: 'Jonli darslar',
  ai20: 'AI-tutor — kuniga 20 ta savol',
  ai50: 'AI-tutor — kuniga 50 ta savol',
  support: 'Ustuvor qo\'llab-quvvatlash',
};

const TIERS = [
  { name: "Boshlang'ich", tier: 1, allCoursesAccess: false, monthly: 79000, yearly: 790000,
    features: [F.discount40, F.cert] },
  { name: 'Standart', tier: 2, allCoursesAccess: true, monthly: 149000, yearly: 1490000,
    features: [F.allFree, F.newFree, F.cert, F.practice, F.live, F.ai20] },
  { name: 'Premium', tier: 3, allCoursesAccess: true, monthly: 249000, yearly: 2490000,
    features: [F.allFree, F.newFree, F.cert, F.practice, F.live, F.ai50, F.support] },
];

const NEW_NAMES = TIERS.map((t) => t.name);

async function main() {
  let created = 0, updated = 0;
  for (const t of TIERS) {
    const variants: Array<{ days: number; price: number }> = [
      { days: 30, price: t.monthly },
      { days: 365, price: t.yearly },
    ];
    for (const v of variants) {
      const data = {
        name: t.name,
        description: null as string | null,
        priceUzs: BigInt(v.price),
        durationDays: v.days,
        tier: t.tier,
        features: t.features,
        allCoursesAccess: t.allCoursesAccess,
        isActive: true,
        sortOrder: t.tier * 10 + (v.days === 30 ? 0 : 1),
      };
      const existing = await prisma.subscriptionPlan.findFirst({
        where: { tier: t.tier, durationDays: v.days, name: { in: NEW_NAMES } },
        select: { id: true },
      });
      if (existing) {
        await prisma.subscriptionPlan.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.subscriptionPlan.create({ data });
        created++;
      }
      console.log(`✓ ${t.name} · ${v.days === 30 ? 'Oylik' : 'Yillik'} · ${v.price.toLocaleString()} so'm (tier ${t.tier})`);
    }
  }

  // Eski rejalarni grandfather: yangi 6 tadan tashqari barchasi → tier 3 + yashirin.
  const grand = await prisma.subscriptionPlan.updateMany({
    where: { name: { notIn: NEW_NAMES } },
    data: { isActive: false, tier: 3 },
  });
  console.log(`\nGrandfather (eski rejalar → tier 3, isActive=false): ${grand.count}`);

  // Boshlang'ich chegirma foizi (global sozlama)
  await prisma.platformSetting.upsert({
    where: { key: 'subscriber_course_discount_pct' },
    create: { key: 'subscriber_course_discount_pct', value: '40' },
    update: { value: '40' },
  });
  console.log('subscriber_course_discount_pct = 40');

  console.log(`\nXULOSA — yaratilgan: ${created} | yangilangan: ${updated}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
