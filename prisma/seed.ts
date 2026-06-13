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

// Universal kategoriyalar — barcha ta'lim yo'nalishlari uchun
const categories: Array<{
  name: string;
  slug: string;
  iconName: string;
  description: string;
  orderIndex: number;
}> = [
  {
    name: 'Tabiiy fanlar',
    slug: 'tabiiy-fanlar',
    iconName: 'BeakerIcon',
    description: 'Matematika, fizika, kimyo, biologiya, astronomiya',
    orderIndex: 1,
  },
  {
    name: 'Tillar',
    slug: 'tillar',
    iconName: 'LanguageIcon',
    description: 'Ingliz, rus, arab, koreys, xitoy va boshqa tillar',
    orderIndex: 2,
  },
  {
    name: 'Dasturlash va IT',
    slug: 'dasturlash',
    iconName: 'CodeBracketIcon',
    description: 'Veb, mobil, ma\'lumotlar tahlili, sun\'iy intellekt',
    orderIndex: 3,
  },
  {
    name: 'Biznes va Boshqaruv',
    slug: 'biznes',
    iconName: 'BriefcaseIcon',
    description: 'Tadbirkorlik, moliya, menejment, buxgalteriya, logistika',
    orderIndex: 4,
  },
  {
    name: 'Marketing va Sotuv',
    slug: 'marketing',
    iconName: 'MegaphoneIcon',
    description: 'Raqamli marketing, SMM, kontent, sotuvlar',
    orderIndex: 5,
  },
  {
    name: 'Dizayn',
    slug: 'dizayn',
    iconName: 'PaintBrushIcon',
    description: 'UI/UX, grafik dizayn, illyustratsiya, brending',
    orderIndex: 6,
  },
  {
    name: 'San\'at va Ijodiyot',
    slug: 'sanat',
    iconName: 'MusicalNoteIcon',
    description: 'Musiqa, ashula, rasm, raqs, teatr',
    orderIndex: 7,
  },
  {
    name: 'Foto va Video',
    slug: 'media',
    iconName: 'VideoCameraIcon',
    description: 'Fotografiya, videografiya, montaj, animatsiya',
    orderIndex: 8,
  },
  {
    name: 'Hunarmandchilik',
    slug: 'hunarmandchilik',
    iconName: 'SparklesIcon',
    description: 'Kulolchilik, yog\'och, tikuvchilik, naqsh, zargarlik',
    orderIndex: 9,
  },
  {
    name: 'Kasb-hunar',
    slug: 'kasb-hunar',
    iconName: 'ScissorsIcon',
    description: 'Pazandachilik, qandolatchilik, sartaroshlik, vizaj',
    orderIndex: 10,
  },
  {
    name: 'Sport va Salomatlik',
    slug: 'sport',
    iconName: 'BoltIcon',
    description: 'Fitnes, yoga, shaxmat, jang san\'atlari, ovqatlanish',
    orderIndex: 11,
  },
  {
    name: 'Tibbiyot va Psixologiya',
    slug: 'tibbiyot',
    iconName: 'HeartIcon',
    description: 'Farmatsevtika, hamshiralik, psixologiya, ilk yordam',
    orderIndex: 12,
  },
  {
    name: 'Huquq',
    slug: 'huquq',
    iconName: 'ScaleIcon',
    description: 'Fuqarolik huquqi, soliq huquqi, umumiy huquq',
    orderIndex: 13,
  },
  {
    name: 'Qishloq xo\'jaligi',
    slug: 'qishloq-xojaligi',
    iconName: 'SunIcon',
    description: 'Dehqonchilik, chorvachilik, asalarichilik, bog\'dorchilik',
    orderIndex: 14,
  },
  {
    name: 'Texnika va Muhandislik',
    slug: 'texnika',
    iconName: 'WrenchScrewdriverIcon',
    description: 'Elektrik, mexanika, qurilish, avto, santexnika',
    orderIndex: 15,
  },
  {
    name: 'Shaxsiy rivojlanish',
    slug: 'rivojlanish',
    iconName: 'TrophyIcon',
    description: 'Yetakchilik, notiqlik, vaqt boshqaruvi, soft skills',
    orderIndex: 16,
  },
  {
    name: 'Bolalar va Ota-onalar',
    slug: 'bolalar',
    iconName: 'UserGroupIcon',
    description: 'Erta rivojlanish, ota-onalik, bola psixologiyasi',
    orderIndex: 17,
  },
  {
    name: 'Din va Ma\'naviyat',
    slug: 'din-manaviyat',
    iconName: 'BookOpenIcon',
    description: 'Islom asoslari, Qur\'on, arab tili (diniy), umumiy ma\'naviyat',
    orderIndex: 18,
  },
  {
    name: 'Gumanitar fanlar',
    slug: 'gumanitar',
    iconName: 'AcademicCapIcon',
    description: 'Tarix, geografiya, adabiyot, falsafa, sotsiologiya',
    orderIndex: 19,
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
