/**
 * Kurs saqlanganda mavzu testlarini (quiz) sinxronlash.
 *
 * Ilgari sehrgardagi savollar kurs payload'iga umuman qo'shilmasdi — faqat alohida
 * "Testni saqlash" tugmasi orqali (u ham courseId/topicId talab qilardi va ko'pincha
 * jimgina ishlamasdi). Natijada savollar sassiz yo'qolardi. Endi savollar kurs bilan
 * BITTA amalda saqlanadi: har mavzu uchun mavjud test almashtiriladi (replace).
 *
 * Chek: platformada e'lon qilinadigan test uchun kamida 5 savol kerak. Shundan kam
 * bo'lsa savollar baribir saqlanadi (yo'qolmaydi), lekin `hasQuiz=false` va ogohlantirish
 * qaytariladi — validatsiya (nashr) buni ushlaydi.
 */
import { prisma } from '@/lib/prisma';
import { createTest, addQuestion, type AddQuestionInput } from '@/lib/services/test.service';

// Sehrgar (client) savol shakli
export interface RawQuizQuestion {
  question?: string;
  options?: unknown;
  correctAnswer?: number;
  explanation?: string;
}

export interface TopicQuizInput {
  topicId: string;
  topicTitle: string;
  questions: RawQuizQuestion[];
}

export interface QuizSyncResult {
  topicId: string;
  savedCount: number;
  hasQuiz: boolean;
  /** 1..4 savol bo'lsa yoki noto'g'ri savollar tashlansa — ogohlantirish */
  warning?: string;
}

const MIN_PUBLISHABLE = 5;

/** Client savolini tekshirib AddQuestionInput'ga o'giradi; yaroqsiz bo'lsa null. */
function toValidInput(raw: RawQuizQuestion): AddQuestionInput | null {
  const text = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (text.length < 2) return null;

  const rawOptions = Array.isArray(raw.options) ? (raw.options as unknown[]) : [];
  // Bo'sh variantlarni tashlaymiz, lekin correctAnswer indeksini asl ro'yxatga nisbatan
  // hisoblaymiz (bo'sh variant tanlangan bo'lsa — yaroqsiz).
  const trimmed = rawOptions.map((o) => (typeof o === 'string' ? o.trim() : ''));
  const correctIdx = typeof raw.correctAnswer === 'number' ? raw.correctAnswer : -1;
  if (correctIdx < 0 || correctIdx >= trimmed.length || !trimmed[correctIdx]) return null;

  const nonEmpty = trimmed.filter(Boolean);
  if (nonEmpty.length < 2) return null;
  // Variant matnlari noyob bo'lishi shart (service ham talab qiladi)
  if (new Set(nonEmpty.map((s) => s.toLowerCase())).size !== nonEmpty.length) return null;

  const correctText = trimmed[correctIdx];
  const options = trimmed
    .map((textVal, i) => ({ text: textVal, isCorrect: i === correctIdx, _keep: !!textVal }))
    .filter((o) => o._keep)
    .map(({ text: textVal, isCorrect }) => ({ text: textVal, isCorrect }));
  // correctText bo'sh variantlar tashlangach ham to'g'ri variant ichida qolishi shart
  if (!options.some((o) => o.isCorrect && o.text === correctText)) return null;

  return {
    questionText: text,
    questionType: 'single',
    options,
    explanation: typeof raw.explanation === 'string' ? raw.explanation.trim() || undefined : undefined,
    points: 10,
  };
}

/**
 * Bir mavzuning testini almashtiradi. Eski testlar o'chiriladi, yaroqli savollardan
 * yangi test yaratiladi. Mavzuning `hasQuiz` bayrog'i yangilanadi.
 */
async function syncOneTopic(
  teacherId: string,
  courseId: string,
  input: TopicQuizInput,
): Promise<QuizSyncResult> {
  const valid = (input.questions || [])
    .map(toValidInput)
    .filter((q): q is AddQuestionInput => q !== null);
  const droppedInvalid = (input.questions?.length || 0) - valid.length;

  // XAVFSIZLIK: shu mavzuning mavjud testlarini tekshiramiz. Agar testda TALABA
  // URINISHLARI bo'lsa — uni O'CHIRMAYMIZ (deleteMany cascade urinish tarixini ham
  // yo'q qilardi). Bunday holatda sehrgardan qayta yozishni o'tkazib yuboramiz va
  // ogohlantiramiz. Faqat urinishsiz testlar almashtiriladi.
  const existing = await prisma.courseTest.findMany({
    where: { topicId: input.topicId, teacherId },
    select: { id: true, _count: { select: { attempts: true } } },
  });
  const hasAttempts = existing.some((e) => e._count.attempts > 0);
  if (hasAttempts) {
    await prisma.courseTopic.update({ where: { id: input.topicId }, data: { hasQuiz: true } });
    return {
      topicId: input.topicId,
      savedCount: 0,
      hasQuiz: true,
      warning: `"${input.topicTitle}" — mavjud testda talaba urinishlari bor, saqlab qolindi (sehrgardan qayta yozilmadi)`,
    };
  }
  // Urinishsiz eski testlarni almashtiramiz (cascade savollar ham)
  if (existing.length > 0) {
    await prisma.courseTest.deleteMany({
      where: { id: { in: existing.map((e) => e.id) } },
    });
  }

  const hasQuiz = valid.length >= MIN_PUBLISHABLE;

  if (valid.length > 0) {
    const test = await createTest(teacherId, {
      courseId,
      topicId: input.topicId,
      title: input.topicTitle?.trim() || 'Test',
      passingScore: 80,
    });
    for (const q of valid) {
      await addQuestion(test.id, teacherId, q);
    }
    // ≥5 bo'lsa e'lon uchun tayyor holatga o'tkazamiz
    if (hasQuiz) {
      await prisma.courseTest.update({ where: { id: test.id }, data: { status: 'published' } });
    }
  }

  await prisma.courseTopic.update({
    where: { id: input.topicId },
    data: { hasQuiz },
  });

  let warning: string | undefined;
  if (valid.length > 0 && valid.length < MIN_PUBLISHABLE) {
    warning = `"${input.topicTitle}" — ${valid.length}/${MIN_PUBLISHABLE} savol saqlandi, ammo test e'lon qilinishi uchun kamida ${MIN_PUBLISHABLE} savol kerak`;
  } else if (droppedInvalid > 0 && valid.length === 0) {
    warning = `"${input.topicTitle}" — savollar to'liq to'ldirilmagani uchun saqlanmadi`;
  }

  return { topicId: input.topicId, savedCount: valid.length, hasQuiz, warning };
}

/**
 * Kursning barcha mavzu testlarini sinxronlaydi. Har mavzu mustaqil — bittasi xato
 * bersa qolganini to'xtatmaydi (best-effort; savollar yo'qolmasligi ustuvor).
 */
export async function syncTopicQuizzes(
  teacherId: string,
  courseId: string,
  inputs: TopicQuizInput[],
): Promise<{ results: QuizSyncResult[]; warnings: string[] }> {
  const results: QuizSyncResult[] = [];
  for (const input of inputs) {
    try {
      results.push(await syncOneTopic(teacherId, courseId, input));
    } catch (err) {
      results.push({
        topicId: input.topicId,
        savedCount: 0,
        hasQuiz: false,
        warning: `"${input.topicTitle}" — testni saqlashda xato: ${err instanceof Error ? err.message : 'nomaʼlum'}`,
      });
    }
  }
  const warnings = results.map((r) => r.warning).filter((w): w is string => !!w);
  return { results, warnings };
}
