/**
 * Kurs sotib olish so'rovi (to'lov shlyuzisiz, admin tasdig'i orqali).
 * Obuna-so'rov (subscription.service) naqshining kurs uchun ko'rinishi.
 * Student "sotib olish" bosadi → CoursePurchaseRequest (pending) → admin tasdiqlaydi →
 * talaba kursga yoziladi + PaymentTransaction (completed) + bildirishnoma.
 */
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { createNotification } from '@/lib/repositories/notification.repository';
import { handlePaymentCompleted } from '@/lib/repositories/referral.repository';

/** Student kurs sotib olish so'rovi yaratadi. Kutilayotgan so'rov bo'lsa — dublikat qilmaydi. */
export async function createCoursePurchaseRequest(
  userId: string,
  courseId: string,
  paymentMethod?: string | null,
): Promise<{ id: string; status: string; alreadyPending: boolean }> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, isPublished: true, suspendedAt: null, moderationStatus: { not: 'rejected' } },
    select: { id: true, priceUzs: true },
  });
  if (!course) throw new ValidationError('Kurs topilmadi');
  if (Number(course.priceUzs) <= 0) throw new ValidationError('Bu kurs bepul — sotib olish shart emas');

  const enrolled = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId } },
    select: { isActive: true },
  });
  if (enrolled?.isActive) throw new ValidationError('Siz allaqachon bu kursga yozilgansiz');

  // Narx snapshot'i: student ko'rgan summa so'rovga yoziladi — approve paytida narx
  // o'zgarsa ham student ko'rgan summa ishlatiladi. (Obuna chegirmasi olib tashlandi —
  // student obuna rejimi mavjud emas, kurs to'liq narxda sotiladi.)
  const priceSnapshot = BigInt(Number(course.priceUzs));

  const existing = await prisma.coursePurchaseRequest.findFirst({
    where: { userId, courseId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (existing) return { id: existing.id, status: 'pending', alreadyPending: true };

  const created = await prisma.coursePurchaseRequest.create({
    data: {
      userId,
      courseId,
      paymentMethod: paymentMethod ?? null,
      status: 'pending',
      priceUzsSnapshot: priceSnapshot,
    },
    select: { id: true, status: true },
  });
  return { ...created, alreadyPending: false };
}

/** Studentning shu kurs bo'yicha kutilayotgan so'rovi (banner uchun). */
export async function getPendingCoursePurchaseRequest(userId: string, courseId: string) {
  const r = await prisma.coursePurchaseRequest.findFirst({
    where: { userId, courseId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, paymentMethod: true, createdAt: true },
  });
  return r ?? null;
}

/** Admin — kurs sotib olish so'rovlari ro'yxati (default: kutilayotgan). */
export async function listCoursePurchaseRequests(status = 'pending') {
  const rows = await prisma.coursePurchaseRequest.findMany({
    where: status === 'all' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { fullName: true, email: true } },
      course: { select: { title: true, priceUzs: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    studentName: r.user?.fullName ?? '—',
    studentEmail: r.user?.email ?? '',
    courseTitle: r.course?.title ?? '—',
    priceUzs: (r.priceUzsSnapshot ?? r.course?.priceUzs)?.toString() ?? '0',
    paymentMethod: r.paymentMethod,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

/** Admin so'rovni TASDIQLAYDI → talaba kursga yoziladi + to'lov yozuvi + bildirishnoma. */
export async function approveCoursePurchaseRequest(
  requestId: string,
  adminId: string,
): Promise<{ userId: string; courseId: string }> {
  const reqRow = await prisma.coursePurchaseRequest.findUnique({ where: { id: requestId } });
  if (!reqRow) throw new ValidationError("So'rov topilmadi");
  if (reqRow.status !== 'pending') throw new ValidationError("So'rov allaqachon ko'rib chiqilgan");

  const course = await prisma.course.findUnique({
    where: { id: reqRow.courseId },
    select: { id: true, title: true, priceUzs: true },
  });
  if (!course) throw new ValidationError('Kurs topilmadi');

  // Student rozi bo'lgan (chegirmali) summa — snapshot bo'lsa o'sha, aks holda joriy narx.
  const chargeAmount = reqRow.priceUzsSnapshot ?? course.priceUzs;

  let txnId: string | null = null;
  await prisma.$transaction(async (tx) => {
    // Atomik status-guard: FAQAT hali 'pending' bo'lsa 'approved' qilamiz. Parallel
    // ikkinchi approve count=0 oladi → butun tranzaksiya bekor qilinadi (dublikat
    // tranzaksiya/enrollment bo'lmaydi).
    const claimed = await tx.coursePurchaseRequest.updateMany({
      where: { id: requestId, status: 'pending' },
      data: { status: 'approved', reviewedById: adminId, reviewedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new ValidationError("So'rov allaqachon ko'rib chiqilgan");
    }

    // Enrollment (race-safe) + counter
    const created = await tx.enrollment.createMany({
      data: [{ studentId: reqRow.userId, courseId: reqRow.courseId, isActive: true }],
      skipDuplicates: true,
    });
    if (created.count > 0) {
      await tx.course.update({ where: { id: reqRow.courseId }, data: { enrollmentCount: { increment: 1 } } });
    } else {
      // Qayta faollashtirish — hisoblagichni ham qaytaramiz (refund decrement qilgan edi).
      const reactivated = await tx.enrollment.updateMany({
        where: { studentId: reqRow.userId, courseId: reqRow.courseId, isActive: false },
        data: { isActive: true },
      });
      if (reactivated.count > 0) {
        await tx.course.update({ where: { id: reqRow.courseId }, data: { enrollmentCount: { increment: reactivated.count } } });
      }
    }
    // To'lov tarixida ko'rinishi uchun completed tranzaksiya
    const txn = await tx.paymentTransaction.create({
      data: {
        studentId: reqRow.userId,
        kind: 'course',
        courseId: reqRow.courseId,
        amountUzs: chargeAmount,
        currency: 'UZS',
        paymentMethod: (reqRow.paymentMethod === 'payme' ? 'payme' : 'click') as never,
        status: 'completed',
        completedAt: new Date(),
        metadata: { source: 'purchase_request_approved' },
      },
      select: { id: true },
    });
    txnId = txn.id;
  });

  // Referral komissiyasi (best-effort, $tx'dan keyin) — sourceTransactionId @unique
  // bo'lgani uchun qayta chaqirilsa dublikat yaratmaydi.
  if (txnId) {
    try { await handlePaymentCompleted(txnId); } catch (e) { console.error('[course-purchase] referral hook:', e); }
  }

  await createNotification({
    recipientId: reqRow.userId,
    type: 'enrollment',
    title: 'To\'lovingiz tasdiqlandi',
    message: `"${course.title}" kursi uchun to'lov tasdiqlandi — kursga yozildingiz. O'qishni boshlashingiz mumkin.`,
    relatedCourseId: reqRow.courseId,
    email: true,
  });

  return { userId: reqRow.userId, courseId: reqRow.courseId };
}

/** Admin so'rovni RAD ETADI. */
export async function rejectCoursePurchaseRequest(requestId: string, adminId: string): Promise<void> {
  const reqRow = await prisma.coursePurchaseRequest.findUnique({ where: { id: requestId } });
  if (!reqRow) throw new ValidationError("So'rov topilmadi");
  if (reqRow.status !== 'pending') throw new ValidationError("So'rov allaqachon ko'rib chiqilgan");

  await prisma.coursePurchaseRequest.update({
    where: { id: requestId },
    data: { status: 'rejected', reviewedById: adminId, reviewedAt: new Date() },
  });

  const course = await prisma.course.findUnique({
    where: { id: reqRow.courseId },
    select: { title: true },
  });
  await createNotification({
    recipientId: reqRow.userId,
    type: 'payment',
    title: 'Sotib olish so\'rovi rad etildi',
    message: `"${course?.title ?? 'Kurs'}" uchun so'rovingiz rad etildi. Savollar bo'lsa qo'llab-quvvatlashga murojaat qiling.`,
    relatedCourseId: reqRow.courseId,
    email: true,
  });
}
