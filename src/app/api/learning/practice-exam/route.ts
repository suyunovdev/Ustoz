/**
 * POST /api/learning/practice-exam
 * Obuna-only AI mock imtihon generatori (DTM/abituriyent tayyorlash).
 * Berilgan fan bo'yicha ko'p variantli savollar tuzadi.
 *
 * Body: { subject: string, difficulty?: 'beginner'|'intermediate'|'advanced', count?: 10|20|30 }
 * Response: { questions: [{ id, question, options[4], correctIndex, explanation, topic }] }
 *
 * Gate: faol obuna. Kunlik limit: 10 imtihon/foydalanuvchi.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { complete, isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { hasActiveSubscription } from '@/lib/services/subscription.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSubjectLabel } from '@/lib/data/subject-labels';
import { platformDayLabel, platformDayIso } from '@/lib/date/platform-day';

const DAILY_LIMIT = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const ALLOWED_COUNTS = [10, 20, 30];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

interface RawQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  topic?: string;
}

function extractJson(text: string): unknown {
  // ```json ... ``` yoki toza JSON — birinchi [ dan oxirgi ] gacha
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : text;
  const start = body.indexOf('[');
  const end = body.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) throw new Error('JSON topilmadi');
  return JSON.parse(body.slice(start, end + 1));
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireStudent(req);

    if (!(await hasActiveSubscription(session.sub))) {
      return jsonResponse(
        { error: "Imtihon banki obuna bilan ishlaydi.", code: 'SUBSCRIPTION_REQUIRED' },
        { status: 403 },
      );
    }
    if (!isAnthropicConfigured()) {
      return jsonResponse(
        { error: "AI hozircha sozlanmagan. Keyinroq urinib ko'ring.", code: 'AI_NOT_CONFIGURED' },
        { status: 503 },
      );
    }

    // Kunlik limit — O'zbekiston kalendar kuni bo'yicha (UTC EMAS).
    const day = platformDayIso(platformDayLabel());
    const rl = await checkRateLimit(`practice-exam:${session.sub}:${day}`, DAILY_LIMIT, DAY_MS);
    if (!rl.allowed) {
      return jsonResponse(
        { error: `Bugungi imtihon limiti tugadi (${DAILY_LIMIT} ta).`, code: 'DAILY_LIMIT_REACHED' },
        { status: 429 },
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const subjectRaw = typeof body.subject === 'string' ? body.subject.trim().slice(0, 60) : '';
    if (subjectRaw.length < 2) throw new ValidationError('Fan tanlanishi kerak');
    const subjectLabel = getSubjectLabel(subjectRaw) || subjectRaw;
    const difficulty = DIFFICULTIES.includes(body.difficulty as string) ? (body.difficulty as string) : 'intermediate';
    const count = ALLOWED_COUNTS.includes(Number(body.count)) ? Number(body.count) : 10;

    const diffUz =
      difficulty === 'beginner' ? "boshlang'ich" : difficulty === 'advanced' ? "ilg'or" : "o'rta";

    const system = `Sen "Ustoz" ta'lim platformasi uchun imtihon savollari tuzuvchi mutaxassisan. O'zbekiston DTM/abituriyent imtihonlariga o'xshash sifatli test savollari tuzasan.
QAT'IY QOIDALAR:
- FAQAT o'zbek tilida (lotin yozuvida).
- Har savol ANIQ 4 ta variantga ega, faqat BITTA to'g'ri javob.
- Variantlar ishonarli bo'lsin (chalg'ituvchilar mantiqiy).
- Har savolga qisqa izoh (nega to'g'ri) va mavzu tegi qo'sh.
- FAQAT quyidagi JSON massivini qaytar, boshqa hech narsa yozma:
[{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","topic":"..."}]`;

    const user = `Fan: ${subjectLabel}. Daraja: ${diffUz}. ${count} ta ko'p variantli test savoli tuz.`;

    const { text } = await complete({
      system,
      messages: [{ role: 'user', content: user }],
      maxTokens: Math.min(4000, 300 + count * 160),
      temperature: 0.8,
    });

    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch {
      return jsonResponse({ error: "Savollar tuzib bo'lmadi. Qayta urinib ko'ring.", code: 'PARSE_FAILED' }, { status: 502 });
    }

    const questions = (Array.isArray(parsed) ? parsed : [])
      .filter(
        (q): q is RawQ =>
          !!q && typeof q === 'object' &&
          typeof (q as RawQ).question === 'string' &&
          Array.isArray((q as RawQ).options) && (q as RawQ).options.length === 4 &&
          Number.isInteger((q as RawQ).correctIndex) &&
          (q as RawQ).correctIndex >= 0 && (q as RawQ).correctIndex <= 3,
      )
      .slice(0, count)
      .map((q, i) => ({
        id: `q${i + 1}`,
        question: q.question,
        options: q.options.map((o) => String(o)),
        correctIndex: q.correctIndex,
        explanation: typeof q.explanation === 'string' ? q.explanation : '',
        topic: typeof q.topic === 'string' ? q.topic : subjectLabel,
      }));

    if (questions.length === 0) {
      return jsonResponse({ error: "Savollar tuzib bo'lmadi. Qayta urinib ko'ring.", code: 'PARSE_FAILED' }, { status: 502 });
    }

    return jsonResponse({ questions, subject: subjectLabel, remaining: rl.remaining });
  } catch (err) {
    return errorResponse(err);
  }
}
