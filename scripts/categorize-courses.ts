/**
 * Bulk-categorize existing courses by title heuristic.
 *
 * Run: `npx tsx -r dotenv/config scripts/categorize-courses.ts`
 *
 * Faqat `categoryId IS NULL` bo'lgan kurslarga teginadi.
 * Hech qanday match topilmasa — kurs categoryId NULL bo'lib qoladi.
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const rules: Array<{ pattern: RegExp; slug: string }> = [
  { pattern: /python|javascript|react|node|java|kotlin|swift|web|dasturlash|programming|backend|frontend|html|css/i, slug: 'dasturlash' },
  { pattern: /design|figma|photoshop|illustrator|dizayn|ui\b|ux\b/i, slug: 'dizayn' },
  { pattern: /business|biznes|management|menejment|tadbirkor|finance|moliya/i, slug: 'biznes' },
  { pattern: /english|ingliz|russian|rus tili|korean|koreys|arab|til\b|language/i, slug: 'tillar' },
  { pattern: /marketing|smm|reklama|kontent\s*marketing/i, slug: 'marketing' },
  { pattern: /foto|video|photo|montaj|animation|animatsiya|premiere|after.?effects/i, slug: 'media' },
];

async function main() {
  console.log('🔎 Categorizing courses by title heuristic...\n');

  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const slugToId = new Map(cats.map((c) => [c.slug, c.id]));

  const courses = await prisma.course.findMany({
    where: { categoryId: null },
    select: { id: true, title: true },
  });

  if (courses.length === 0) {
    console.log('Hech qanday kategoriyasiz kurs yo\'q — done');
    return;
  }

  let matched = 0;
  let unmatched = 0;

  for (const course of courses) {
    let assigned = false;
    for (const rule of rules) {
      if (rule.pattern.test(course.title)) {
        const catId = slugToId.get(rule.slug);
        if (catId) {
          await prisma.course.update({
            where: { id: course.id },
            data: { categoryId: catId },
          });
          console.log(`✓ ${course.title.padEnd(35)} → ${rule.slug}`);
          matched++;
          assigned = true;
          break;
        }
      }
    }
    if (!assigned) {
      console.log(`✗ ${course.title.padEnd(35)} → (no match)`);
      unmatched++;
    }
  }

  console.log(`\n📊 Matched: ${matched} · Unmatched: ${unmatched} · Total: ${courses.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
