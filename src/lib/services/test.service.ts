/**
 * Test Service
 * ------------
 * Test/quiz biznes logikasi:
 *   - Test CRUD + ownership check
 *   - Question CRUD + validation (question type'ga ko'ra)
 *   - Talaba attempt: start, submit, auto-grading
 *
 * Avtomatik baholash qoidalari:
 *   - 'single'    — javob to'g'ri options.text bilan mos → full points
 *   - 'multiple'  — barcha to'g'ri options tanlangan VA noto'g'ri tanlanmagan → full points
 *   - 'true_false'— javob ('true'/'false') correctAnswers[0] bilan mos
 *   - 'text'      — case-insensitive trim, correctAnswers (string[]) ichida bormi
 */

import {
  testRepo,
  type TestRow,
  type QuestionRow,
  type AttemptRow,
  type QuestionOption,
  type QuestionType,
  type TestStatus,
  type CreateTestInput,
  type UpdateTestInput,
  type CreateQuestionInput,
  type UpdateQuestionInput,
} from '@/lib/repositories';
import { ServiceError, ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

// Barcha custom error'lar ServiceError'dan extend qilingan —
// isServiceError() type guard to'g'ri ishlashi uchun.

export class TestNotFoundError extends ServiceError {
  constructor(id: string) {
    super(`Test topilmadi: ${id}`, 'TEST_NOT_FOUND');
  }
}

export class TestAccessDeniedError extends ServiceError {
  constructor() {
    super("Bu test sizniki emas", 'TEST_ACCESS_DENIED');
  }
}

export class CourseAccessDeniedError extends ServiceError {
  constructor() {
    super("Bu kurs sizniki emas", 'COURSE_ACCESS_DENIED');
  }
}

export class TestNotPublishedError extends ServiceError {
  constructor() {
    super("Test hali e'lon qilinmagan", 'TEST_NOT_PUBLISHED');
  }
}

export class AttemptLimitExceededError extends ServiceError {
  constructor(limit: number) {
    super(`Urinishlar tugadi (max ${limit})`, 'ATTEMPT_LIMIT_EXCEEDED');
  }
}

export class AttemptNotFoundError extends ServiceError {
  constructor() {
    super("Urinish topilmadi", 'ATTEMPT_NOT_FOUND');
  }
}

export class AttemptAlreadySubmittedError extends ServiceError {
  constructor() {
    super("Urinish allaqachon yakunlangan", 'ATTEMPT_ALREADY_SUBMITTED');
  }
}

const VALID_QUESTION_TYPES = new Set<QuestionType>([
  'single',
  'multiple',
  'true_false',
  'text',
]);

const VALID_STATUSES = new Set<TestStatus>(['draft', 'published', 'archived']);

// ==================== TEST CRUD ====================

export interface CreateTestServiceInput {
  courseId: string;
  topicId?: string | null;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimitSec?: number | null;
  allowedAttempts?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
}

function validateTitle(t: string) {
  const title = t.trim();
  if (title.length < 2) throw new ValidationError("Sarlavha kamida 2 belgi");
  if (title.length > 200) throw new ValidationError("Sarlavha 200 belgidan oshmasin");
  return title;
}

function validatePassingScore(n: number) {
  if (n < 0 || n > 100) throw new ValidationError("O'tish bali 0-100 oralig'ida");
}

async function assertCourseOwner(courseId: string, teacherId: string): Promise<void> {
  const c = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!c) throw new ValidationError("Kurs topilmadi");
  if (c.teacherId !== teacherId) throw new CourseAccessDeniedError();
}

export async function createTest(
  teacherId: string,
  input: CreateTestServiceInput,
): Promise<TestRow> {
  await assertCourseOwner(input.courseId, teacherId);
  const title = validateTitle(input.title);
  if (input.passingScore !== undefined) validatePassingScore(input.passingScore);
  if (input.timeLimitSec !== undefined && input.timeLimitSec !== null) {
    if (input.timeLimitSec < 30) throw new ValidationError("Vaqt kamida 30 sekund");
    if (input.timeLimitSec > 7200) throw new ValidationError("Vaqt 2 soatdan oshmasin");
  }
  if (input.allowedAttempts !== undefined && input.allowedAttempts < 0) {
    throw new ValidationError("Urinishlar 0 yoki musbat");
  }

  // topic ham xuddi shu kursga tegishli bo'lishi shart
  if (input.topicId) {
    const topic = await prisma.courseTopic.findUnique({
      where: { id: input.topicId },
      select: { courseId: true },
    });
    if (!topic || topic.courseId !== input.courseId) {
      throw new ValidationError("Topic ushbu kursga tegishli emas");
    }
  }

  return testRepo.createTest({
    teacherId,
    courseId: input.courseId,
    topicId: input.topicId ?? null,
    title,
    description: input.description?.trim() ?? null,
    passingScore: input.passingScore,
    timeLimitSec: input.timeLimitSec,
    allowedAttempts: input.allowedAttempts,
    randomizeQuestions: input.randomizeQuestions,
    showCorrectAnswers: input.showCorrectAnswers,
  });
}

export async function getTestForTeacher(testId: string, teacherId: string) {
  const test = await testRepo.findTestWithQuestions(testId);
  if (!test) throw new TestNotFoundError(testId);
  if (test.teacherId !== teacherId) throw new TestAccessDeniedError();
  return test;
}

export async function listTeacherTests(
  teacherId: string,
  filters: { courseId?: string; topicId?: string; status?: TestStatus } = {},
) {
  return testRepo.listTeacherTests(teacherId, filters);
}

export async function updateTest(
  testId: string,
  teacherId: string,
  input: UpdateTestInput,
): Promise<TestRow> {
  const access = await testRepo.isTestOwner(testId, teacherId);
  if (!access.ok) throw new TestAccessDeniedError();

  const patch: UpdateTestInput = {};
  if (input.title !== undefined) patch.title = validateTitle(input.title);
  if (input.description !== undefined) patch.description = input.description;
  if (input.passingScore !== undefined) {
    validatePassingScore(input.passingScore);
    patch.passingScore = input.passingScore;
  }
  if (input.timeLimitSec !== undefined) patch.timeLimitSec = input.timeLimitSec;
  if (input.allowedAttempts !== undefined) {
    if (input.allowedAttempts < 0) throw new ValidationError("Urinishlar 0 yoki musbat");
    patch.allowedAttempts = input.allowedAttempts;
  }
  if (input.randomizeQuestions !== undefined) patch.randomizeQuestions = input.randomizeQuestions;
  if (input.showCorrectAnswers !== undefined) patch.showCorrectAnswers = input.showCorrectAnswers;
  if (input.status !== undefined) {
    if (!VALID_STATUSES.has(input.status as TestStatus)) {
      throw new ValidationError(`Noto'g'ri status: ${input.status}`);
    }
    if (input.status === 'published') {
      const full = await testRepo.findTestWithQuestions(testId);
      if (!full || full.questions.length === 0) {
        throw new ValidationError("E'lon qilish uchun kamida 1 ta savol kerak");
      }
    }
    patch.status = input.status;
  }
  if (input.topicId !== undefined) patch.topicId = input.topicId;

  return testRepo.updateTest(testId, patch);
}

export async function deleteTest(testId: string, teacherId: string): Promise<void> {
  const access = await testRepo.isTestOwner(testId, teacherId);
  if (!access.ok) throw new TestAccessDeniedError();
  await testRepo.deleteTest(testId);
}

// ==================== QUESTIONS ====================

export interface AddQuestionInput {
  questionText: string;
  questionType: QuestionType;
  options?: QuestionOption[];
  correctAnswers?: string[];
  points?: number;
  explanation?: string;
}

function validateQuestionShape(input: AddQuestionInput | UpdateQuestionInput, isUpdate = false) {
  if ('questionText' in input && input.questionText !== undefined) {
    if (input.questionText.trim().length < 2) {
      throw new ValidationError("Savol matni kamida 2 belgi");
    }
  } else if (!isUpdate) {
    throw new ValidationError("Savol matni majburiy");
  }

  if ('questionType' in input && input.questionType !== undefined) {
    if (!VALID_QUESTION_TYPES.has(input.questionType as QuestionType)) {
      throw new ValidationError(`Noto'g'ri tur: ${input.questionType}`);
    }
  }

  if ('points' in input && input.points !== undefined) {
    if (input.points < 0 || input.points > 100) {
      throw new ValidationError("Bal 0-100 oralig'ida");
    }
  }

  const qt = (input as AddQuestionInput).questionType;
  if (qt === 'single' || qt === 'multiple') {
    const opts = (input as AddQuestionInput).options;
    if (!opts || opts.length < 2) {
      throw new ValidationError("Variantlar kamida 2 ta bo'lishi kerak");
    }
    const correctCount = opts.filter((o) => o.isCorrect).length;
    if (qt === 'single' && correctCount !== 1) {
      throw new ValidationError("Single tur — aniq 1 ta to'g'ri javob");
    }
    if (qt === 'multiple' && correctCount < 1) {
      throw new ValidationError("Multiple tur — kamida 1 ta to'g'ri javob");
    }
  } else if (qt === 'true_false') {
    const ca = (input as AddQuestionInput).correctAnswers;
    if (!ca || ca.length !== 1 || !['true', 'false'].includes(ca[0])) {
      throw new ValidationError("True/False — correctAnswers ['true'] yoki ['false']");
    }
  } else if (qt === 'text') {
    const ca = (input as AddQuestionInput).correctAnswers;
    if (!ca || ca.length === 0) {
      throw new ValidationError("Text tur — kamida 1 ta to'g'ri javob");
    }
  }
}

export async function addQuestion(
  testId: string,
  teacherId: string,
  input: AddQuestionInput,
): Promise<QuestionRow> {
  const access = await testRepo.isTestOwner(testId, teacherId);
  if (!access.ok) throw new TestAccessDeniedError();

  validateQuestionShape(input);

  return testRepo.createQuestion({
    testId,
    questionText: input.questionText.trim(),
    questionType: input.questionType,
    options: input.options ?? null,
    correctAnswers: input.correctAnswers ?? null,
    points: input.points ?? 1,
    explanation: input.explanation ?? null,
  });
}

export async function updateQuestion(
  questionId: string,
  teacherId: string,
  input: UpdateQuestionInput,
): Promise<QuestionRow> {
  const q = await prisma.testQuestion.findUnique({
    where: { id: questionId },
    select: { testId: true },
  });
  if (!q) throw new ValidationError("Savol topilmadi");
  const access = await testRepo.isTestOwner(q.testId, teacherId);
  if (!access.ok) throw new TestAccessDeniedError();

  validateQuestionShape(input, true);

  return testRepo.updateQuestion(questionId, input as UpdateQuestionInput);
}

export async function deleteQuestion(
  questionId: string,
  teacherId: string,
): Promise<void> {
  const q = await prisma.testQuestion.findUnique({
    where: { id: questionId },
    select: { testId: true },
  });
  if (!q) throw new ValidationError("Savol topilmadi");
  const access = await testRepo.isTestOwner(q.testId, teacherId);
  if (!access.ok) throw new TestAccessDeniedError();

  await testRepo.deleteQuestion(questionId);
}

// ==================== STUDENT ATTEMPTS ====================

export async function startTestAttempt(
  testId: string,
  studentId: string,
): Promise<{
  attempt: AttemptRow;
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    options: any;
    points: number;
    questionOrder: number;
  }>;
  test: {
    id: string;
    title: string;
    timeLimitSec: number | null;
    totalPoints: number;
    passingScore: number;
  };
}> {
  const test = await testRepo.findTestWithQuestions(testId);
  if (!test) throw new TestNotFoundError(testId);
  if (test.status !== 'published') throw new TestNotPublishedError();

  if (test.allowedAttempts > 0) {
    const used = await testRepo.countAttempts(testId, studentId);
    if (used >= test.allowedAttempts) {
      throw new AttemptLimitExceededError(test.allowedAttempts);
    }
  }

  // Active attempt bo'lsa, uni qaytaramiz (resume)
  const active = await testRepo.findActiveAttempt(testId, studentId);
  const attempt = active ?? (await testRepo.startAttempt({ testId, studentId }));

  const questions = test.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    // Talabaga `isCorrect` flagini bermaslik kerak
    options: Array.isArray(q.options)
      ? (q.options as QuestionOption[]).map((o) => ({ text: o.text }))
      : null,
    points: q.points,
    questionOrder: q.questionOrder,
  }));

  if (test.randomizeQuestions) {
    questions.sort(() => Math.random() - 0.5);
  } else {
    questions.sort((a, b) => a.questionOrder - b.questionOrder);
  }

  return {
    attempt,
    questions,
    test: {
      id: test.id,
      title: test.title,
      timeLimitSec: test.timeLimitSec,
      totalPoints: test.totalPoints,
      passingScore: test.passingScore,
    },
  };
}

// Auto-grading
function gradeAnswer(
  question: QuestionRow,
  answer: string | string[] | undefined,
): { correct: boolean; pointsEarned: number } {
  if (answer === undefined || answer === null) {
    return { correct: false, pointsEarned: 0 };
  }

  const options: QuestionOption[] = Array.isArray(question.options)
    ? (question.options as QuestionOption[])
    : [];
  const correctAnswers: string[] = Array.isArray(question.correctAnswers)
    ? (question.correctAnswers as string[])
    : [];

  switch (question.questionType) {
    case 'single': {
      const correctOption = options.find((o) => o.isCorrect);
      const ok = typeof answer === 'string' && correctOption?.text === answer;
      return { correct: ok, pointsEarned: ok ? question.points : 0 };
    }
    case 'multiple': {
      const correct = new Set(options.filter((o) => o.isCorrect).map((o) => o.text));
      const provided = new Set(
        Array.isArray(answer) ? answer : typeof answer === 'string' ? [answer] : [],
      );
      // To'liq mos
      const ok =
        correct.size === provided.size &&
        Array.from(correct).every((t) => provided.has(t));
      return { correct: ok, pointsEarned: ok ? question.points : 0 };
    }
    case 'true_false': {
      const expected = correctAnswers[0] || '';
      const ok = typeof answer === 'string' && answer.toLowerCase() === expected.toLowerCase();
      return { correct: ok, pointsEarned: ok ? question.points : 0 };
    }
    case 'text': {
      const normalized =
        typeof answer === 'string' ? answer.trim().toLowerCase() : '';
      const ok = correctAnswers.some((c) => c.trim().toLowerCase() === normalized);
      return { correct: ok, pointsEarned: ok ? question.points : 0 };
    }
    default:
      return { correct: false, pointsEarned: 0 };
  }
}

export async function submitTestAttempt(
  attemptId: string,
  studentId: string,
  answers: Record<string, string | string[]>,
): Promise<{
  attempt: AttemptRow;
  results: Array<{
    questionId: string;
    correct: boolean;
    pointsEarned: number;
    correctAnswer?: any;
    explanation?: string | null;
  }>;
  passed: boolean;
}> {
  const attempt = await testRepo.findAttemptById(attemptId);
  if (!attempt) throw new AttemptNotFoundError();
  if (attempt.studentId !== studentId) throw new TestAccessDeniedError();
  if (attempt.status !== 'in_progress') throw new AttemptAlreadySubmittedError();

  const test = await testRepo.findTestWithQuestions(attempt.testId);
  if (!test) throw new TestNotFoundError(attempt.testId);

  // Vaqt cheklov tekshiruvi
  if (test.timeLimitSec) {
    const elapsedSec = (Date.now() - attempt.startedAt.getTime()) / 1000;
    if (elapsedSec > test.timeLimitSec + 5) {
      // Auto-expire
      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: { status: 'expired', submittedAt: new Date() },
      });
      throw new ValidationError("Vaqt tugadi");
    }
  }

  let totalScore = 0;
  let totalMax = 0;
  const results: Array<{
    questionId: string;
    correct: boolean;
    pointsEarned: number;
    correctAnswer?: any;
    explanation?: string | null;
  }> = [];

  for (const q of test.questions) {
    totalMax += q.points;
    const { correct, pointsEarned } = gradeAnswer(q, answers[q.id]);
    totalScore += pointsEarned;
    results.push({
      questionId: q.id,
      correct,
      pointsEarned,
      correctAnswer: test.showCorrectAnswers
        ? q.questionType === 'single' || q.questionType === 'multiple'
          ? (q.options as QuestionOption[] | null)?.filter((o) => o.isCorrect).map((o) => o.text)
          : q.correctAnswers
        : undefined,
      explanation: test.showCorrectAnswers ? q.explanation : null,
    });
  }

  const percentage = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;
  const passed = percentage >= test.passingScore;

  const updated = await testRepo.submitAttempt({
    attemptId,
    answers,
    score: totalScore,
    maxScore: totalMax,
    passed,
  });

  return { attempt: updated, results, passed };
}

export async function listMyAttempts(testId: string, studentId: string) {
  return testRepo.listStudentAttempts(testId, studentId);
}

export async function listAttemptsForTeacher(testId: string, teacherId: string) {
  const access = await testRepo.isTestOwner(testId, teacherId);
  if (!access.ok) throw new TestAccessDeniedError();
  return testRepo.listTestAttempts(testId);
}
