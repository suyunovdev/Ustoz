/**
 * Recommendation service test.
 * Run: `npx tsx -r dotenv/config scripts/test-recommendations.ts`
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

// Service uchun prisma'ni o'rnatish (singleton bilan bir xil)
import { getRecommendedCourses, getSimilarCourses } from '../src/lib/services/recommendation.service';

function printRecs(label: string, recs: Awaited<ReturnType<typeof getRecommendedCourses>>) {
  console.log(`\n${label}`);
  console.log(`   Total: ${recs.length}`);
  const breakdown = recs.reduce<Record<string, number>>((acc, r) => {
    acc[r.recommendReason] = (acc[r.recommendReason] || 0) + 1;
    return acc;
  }, {});
  console.log(`   Breakdown:`, breakdown);
  recs.forEach((r, i) => {
    console.log(`   ${i + 1}. [${r.recommendReason.padEnd(15)}] ${r.title.padEnd(20)} cat=${r.category?.slug ?? '—'} rating=${r.rating}`);
  });
}

async function main() {
  console.log('🧪 Recommendation service tests\n');

  // 1. Cold start
  console.log('━━━ TEST 1: Cold start (yangi user) ━━━');
  const fakeId = '00000000-0000-0000-0000-000000000001';
  const cold = await getRecommendedCourses(fakeId, 6);
  printRecs('Cold start:', cold);

  // 2. Real enrolled user
  console.log('\n━━━ TEST 2: Real enrolled user ━━━');
  const realStudent = await prisma.userProfile.findFirst({
    where: { role: 'student', enrollments: { some: {} } },
  });
  if (realStudent) {
    console.log(`Student: ${realStudent.email}`);
    const enr = await prisma.enrollment.findMany({
      where: { studentId: realStudent.id },
      include: { course: { select: { title: true, categoryId: true } } },
    });
    console.log(`Enrollments: ${enr.length}`);
    enr.forEach((e) => console.log(`  - ${e.course.title} (categoryId=${e.course.categoryId ?? 'NULL'})`));

    const recs = await getRecommendedCourses(realStudent.id, 6);
    printRecs('Recommendations:', recs);
  } else {
    console.log('Real enrolled student yo\'q — skip');
  }

  // 3. Similar courses (collaborative filtering)
  console.log('\n━━━ TEST 3: Similar courses ━━━');
  const someCourse = await prisma.course.findFirst({
    where: { isPublished: true, enrollments: { some: {} } },
  });
  if (someCourse) {
    console.log(`Course: "${someCourse.title}"`);
    const similar = await getSimilarCourses(someCourse.id, 4);
    console.log(`   Found ${similar.length} similar courses`);
    similar.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.title} (rating=${s.rating})`);
    });
  } else {
    console.log('Published course with enrollments yo\'q — skip');
  }

  // 4. Edge case: kichik DB
  console.log('\n━━━ TEST 4: Limit > total courses ━━━');
  const totalPublished = await prisma.course.count({ where: { isPublished: true } });
  console.log(`Published courses in DB: ${totalPublished}`);
  if (realStudent) {
    const big = await getRecommendedCourses(realStudent.id, 100);
    console.log(`   Requested 100 → got ${big.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
