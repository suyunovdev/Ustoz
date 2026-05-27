/**
 * Prisma seed — boshlang'ich ma'lumotlar.
 * Ishga tushirish: `npx prisma db seed`
 *
 * Idempotent: takror chaqirsangiz duplicate yaratmaydi (upsert by slug).
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const categories: Array<{
  name: string;
  slug: string;
  iconName: string;
  description: string;
  orderIndex: number;
}> = [
  {
    name: 'Dasturlash',
    slug: 'dasturlash',
    iconName: 'CodeBracketIcon',
    description: 'Veb, mobil va backend dasturlash',
    orderIndex: 1,
  },
  {
    name: 'Dizayn',
    slug: 'dizayn',
    iconName: 'PaintBrushIcon',
    description: 'UI/UX, grafik dizayn, illyustratsiya',
    orderIndex: 2,
  },
  {
    name: 'Biznes',
    slug: 'biznes',
    iconName: 'BriefcaseIcon',
    description: 'Tadbirkorlik, menejment, moliya',
    orderIndex: 3,
  },
  {
    name: 'Tillar',
    slug: 'tillar',
    iconName: 'LanguageIcon',
    description: 'Ingliz, rus, koreys, arab tillari',
    orderIndex: 4,
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    iconName: 'MegaphoneIcon',
    description: 'Raqamli marketing, SMM, kontent',
    orderIndex: 5,
  },
  {
    name: 'Foto va Video',
    slug: 'media',
    iconName: 'VideoCameraIcon',
    description: 'Fotografiya, video montaj, animatsiya',
    orderIndex: 6,
  },
];

async function main() {
  console.log('🌱 Seeding categories...');
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {
        name: cat.name,
        iconName: cat.iconName,
        description: cat.description,
        orderIndex: cat.orderIndex,
      },
    });
  }
  console.log(`✅ ${categories.length} ta kategoriya yaratildi / yangilandi`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
