/**
 * Test repository — `course_tests`, `test_questions`, `test_attempts`.
 *
 * Question turlari:
 *   - 'single'    — bitta to'g'ri javob (radio button)
 *   - 'multiple'  — bir nechta to'g'ri javob (checkbox)
 *   - 'true_false'— rost/yolg'on
 *   - 'text'      — qisqa matnli javob (kalit so'z bilan tekshiriladi)
 *
 * Test status:
 *   - 'draft'      — yangi yaratilgan, talaba ko'rmaydi
 *   - 'published'  — talaba ko'rishi/topshirishi mumkin
 *   - 'archived'   — eskirgan, faqat tarix uchun
 *
 * Attempt status:
 *   - 'in_progress' — boshlangan, hali submit qilinmagan
 *   - 'submitted'   — submit qilingan, baholangan
 *   - 'expired'     — vaqt tugab ketgan
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export type QuestionType = 'single' | 'multiple' | 'true_false' | 'text';
export type TestStatus = 'draft' | 'published' | 'archived';
export type AttemptStatus = 'in_progress' | 'submitted' | 'expired';

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface TestRow {
  id: string;
  teacherId: string;
  courseId: string | null;
  topicId: string | null;
  title: string;
  description: string | null;
  passingScore: number;
  timeLimitSec: number | null;
  allowedAttempts: number;
  status: string;
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionRow {
  id: string;
  testId: string;
  questionOrder: number;
  questionText: string;
  questionType: string;
  options: any;
  correctAnswers: any;
  points: number;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer: string | null;
  explanation: string | null;
  createdAt: Date;
}

export interface AttemptRow {
  id: string;
  testId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: Date;
  submittedAt: Date | null;
  score: number;
  maxScore: number;
  percentage: any;
  passed: boolean;
  answers: any;
  status: string;
}

// ==================== TEST CRUD ====================

export interface CreateTestInput {
  teacherId: string;
  courseId: string;
  topicId?: string | null;
  title: string;
  description?: string | null;
  passingScore?: number;
  timeLimitSec?: number | null;
  allowedAttempts?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
}

export async function createTest(input: CreateTestInput): Promise<TestRow> {
  return prisma.courseTest.create({
    data: {
      teacherId: input.teacherId,
      courseId: input.courseId,
      topicId: input.topicId ?? null,
      title: input.title,
      description: input.description ?? null,
      passingScore: input.passingScore ?? 80,
      timeLimitSec: input.timeLimitSec ?? null,
      allowedAttempts: input.allowedAttempts ?? 0,
      randomizeQuestions: input.randomizeQuestions ?? false,
      showCorrectAnswers: input.showCorrectAnswers ?? true,
      status: 'draft',
    },
  });
}

export async function findTestById(id: string): Promise<TestRow | null> {
  return prisma.courseTest.findUnique({ where: { id } });
}

export async function findTestWithQuestions(
  id: string,
): Promise<(TestRow & { questions: QuestionRow[] }) | null> {
  return prisma.courseTest.findUnique({
    where: { id },
    include: { questions: { orderBy: { questionOrder: 'asc' } } },
  });
}

export async function listTeacherTests(
  teacherId: string,
  filters: { courseId?: string; topicId?: string; status?: TestStatus } = {},
): Promise<Array<TestRow & { questionCount: number; attemptCount: number }>> {
  const where: Prisma.CourseTestWhereInput = { teacherId };
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.topicId) where.topicId = filters.topicId;
  if (filters.status) where.status = filters.status;

  const rows = await prisma.courseTest.findMany({
    where,
    include: { _count: { select: { questions: true, attempts: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    teacherId: r.teacherId,
    courseId: r.courseId,
    topicId: r.topicId,
    title: r.title,
    description: r.description,
    passingScore: r.passingScore,
    timeLimitSec: r.timeLimitSec,
    allowedAttempts: r.allowedAttempts,
    status: r.status,
    randomizeQuestions: r.randomizeQuestions,
    showCorrectAnswers: r.showCorrectAnswers,
    totalPoints: r.totalPoints,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    questionCount: r._count.questions,
    attemptCount: r._count.attempts,
  }));
}

export interface UpdateTestInput {
  title?: string;
  description?: string | null;
  passingScore?: number;
  timeLimitSec?: number | null;
  allowedAttempts?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
  status?: TestStatus;
  topicId?: string | null;
}

export async function updateTest(id: string, data: UpdateTestInput): Promise<TestRow> {
  return prisma.courseTest.update({ where: { id }, data });
}

export async function deleteTest(id: string): Promise<void> {
  await prisma.courseTest.delete({ where: { id } });
}

/**
 * Test course teacher'ga tegishliligini tekshirish.
 */
export async function isTestOwner(
  testId: string,
  teacherId: string,
): Promise<{ ok: boolean; courseId: string | null }> {
  const t = await prisma.courseTest.findUnique({
    where: { id: testId },
    select: { teacherId: true, courseId: true },
  });
  if (!t) return { ok: false, courseId: null };
  return { ok: t.teacherId === teacherId, courseId: t.courseId };
}

// ==================== QUESTIONS ====================

export interface CreateQuestionInput {
  testId: string;
  questionText: string;
  questionType: QuestionType;
  options?: QuestionOption[] | null;
  correctAnswers?: string[] | null;
  points?: number;
  explanation?: string | null;
  questionOrder?: number;
}

export async function createQuestion(input: CreateQuestionInput): Promise<QuestionRow> {
  return prisma.$transaction(async (tx) => {
    const order =
      input.questionOrder ??
      (((
        await tx.testQuestion.aggregate({
          where: { testId: input.testId },
          _max: { questionOrder: true },
        })
      )._max.questionOrder ?? 0) +
        1);

    const created = await tx.testQuestion.create({
      data: {
        testId: input.testId,
        questionOrder: order,
        questionText: input.questionText,
        questionType: input.questionType,
        options: input.options ? (input.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        correctAnswers: input.correctAnswers
          ? (input.correctAnswers as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        points: input.points ?? 1,
        explanation: input.explanation ?? null,
      },
    });

    await recalcTotalPoints(tx, input.testId);
    return created;
  });
}

export interface UpdateQuestionInput {
  questionText?: string;
  questionType?: QuestionType;
  options?: QuestionOption[] | null;
  correctAnswers?: string[] | null;
  points?: number;
  explanation?: string | null;
  questionOrder?: number;
}

export async function updateQuestion(
  id: string,
  data: UpdateQuestionInput,
): Promise<QuestionRow> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.testQuestion.update({
      where: { id },
      data: {
        ...(data.questionText !== undefined && { questionText: data.questionText }),
        ...(data.questionType !== undefined && { questionType: data.questionType }),
        ...(data.options !== undefined && {
          options: data.options ? (data.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        }),
        ...(data.correctAnswers !== undefined && {
          correctAnswers: data.correctAnswers
            ? (data.correctAnswers as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.questionOrder !== undefined && { questionOrder: data.questionOrder }),
      },
    });
    await recalcTotalPoints(tx, updated.testId);
    return updated;
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const q = await tx.testQuestion.findUnique({ where: { id } });
    if (!q) return;
    await tx.testQuestion.delete({ where: { id } });
    await recalcTotalPoints(tx, q.testId);
  });
}

async function recalcTotalPoints(
  tx: Prisma.TransactionClient,
  testId: string,
): Promise<void> {
  const sum = await tx.testQuestion.aggregate({
    where: { testId },
    _sum: { points: true },
  });
  await tx.courseTest.update({
    where: { id: testId },
    data: { totalPoints: sum._sum.points ?? 0 },
  });
}

// ==================== ATTEMPTS ====================

export interface StartAttemptInput {
  testId: string;
  studentId: string;
}

export async function startAttempt(input: StartAttemptInput): Promise<AttemptRow> {
  return prisma.$transaction(async (tx) => {
    const lastAttempt = await tx.testAttempt.findFirst({
      where: { testId: input.testId, studentId: input.studentId },
      orderBy: { attemptNumber: 'desc' },
    });
    const attemptNumber = (lastAttempt?.attemptNumber ?? 0) + 1;

    return tx.testAttempt.create({
      data: {
        testId: input.testId,
        studentId: input.studentId,
        attemptNumber,
        status: 'in_progress',
      },
    });
  });
}

export async function findActiveAttempt(
  testId: string,
  studentId: string,
): Promise<AttemptRow | null> {
  return prisma.testAttempt.findFirst({
    where: { testId, studentId, status: 'in_progress' },
    orderBy: { startedAt: 'desc' },
  });
}

export async function findAttemptById(id: string): Promise<AttemptRow | null> {
  return prisma.testAttempt.findUnique({ where: { id } });
}

export async function countAttempts(testId: string, studentId: string): Promise<number> {
  return prisma.testAttempt.count({
    where: { testId, studentId, status: { in: ['submitted', 'expired'] } },
  });
}

export interface SubmitAttemptInput {
  attemptId: string;
  answers: Record<string, string | string[]>;
  score: number;
  maxScore: number;
  passed: boolean;
}

export async function submitAttempt(input: SubmitAttemptInput): Promise<AttemptRow> {
  const percentage =
    input.maxScore > 0 ? Math.round((input.score / input.maxScore) * 10000) / 100 : 0;
  return prisma.testAttempt.update({
    where: { id: input.attemptId },
    data: {
      submittedAt: new Date(),
      score: input.score,
      maxScore: input.maxScore,
      percentage,
      passed: input.passed,
      answers: input.answers,
      status: 'submitted',
    },
  });
}

export async function listStudentAttempts(
  testId: string,
  studentId: string,
): Promise<AttemptRow[]> {
  return prisma.testAttempt.findMany({
    where: { testId, studentId },
    orderBy: { startedAt: 'desc' },
  });
}

export async function listTestAttempts(
  testId: string,
  limit = 100,
): Promise<Array<AttemptRow & { studentName: string; studentEmail: string }>> {
  const rows = await prisma.testAttempt.findMany({
    where: { testId, status: 'submitted' },
    include: { student: { select: { fullName: true, email: true } } },
    orderBy: { submittedAt: 'desc' },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    testId: r.testId,
    studentId: r.studentId,
    attemptNumber: r.attemptNumber,
    startedAt: r.startedAt,
    submittedAt: r.submittedAt,
    score: r.score,
    maxScore: r.maxScore,
    percentage: r.percentage,
    passed: r.passed,
    answers: r.answers,
    status: r.status,
    studentName: r.student.fullName,
    studentEmail: r.student.email,
  }));
}
