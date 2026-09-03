/**
 * POST /api/learning/ai-tutor
 * Obuna-only AI o'quv yordamchisi — dars kontekstida savolga javob beradi,
 * tushuntiradi, mashq generatsiya qiladi yoki maslahat (javob emas) beradi.
 *
 * Body:
 *   {
 *     question: string,
 *     mode?: 'ask' | 'explain' | 'practice' | 'hint',
 *     topicTitle?: string,
 *     topicContent?: string,   // HTML yoki matn — server tomonda tozalanadi
 *     courseTitle?: string,
 *     history?: { role: 'user' | 'assistant', content: string }[]
 *   }
 *
 * Response: { answer: string, remaining: number }
 *
 * Gate: faol obuna (hasActiveSubscription). Kunlik limit: 30 xabar/foydalanuvchi.
 */

import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { complete, isAnthropicConfigured } from '@/lib/ai/anthropic-client';
import { hasActiveSubscription } from '@/lib/services/subscription.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { platformDayLabel, platformDayIso } from '@/lib/date/platform-day';

const DAILY_LIMIT = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_QUESTION = 1000;
const MAX_CONTEXT_CHARS = 4000;
const MAX_HISTORY = 6;

type Mode = 'ask' | 'explain' | 'practice' | 'hint';
const MODES: Mode[] = ['ask', 'explain', 'practice', 'hint'];

/** HTML teglarni olib tashlab, matnni qisqartiradi (token nazorati). */
function toPlainText(raw: string, limit: number): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

const SYSTEM_PROMPT = `Sen "Ustoz" onlayn ta'lim platformasining AI o'quv yordamchisisan. Talabaga dars materialini tushunishda yordam berasan.

QAT'IY QOIDALAR:
- FAQAT o'zbek tilida (lotin yozuvida) javob ber. Hech qachon kirill yozuvda yozma.
- Javoblarni berilgan dars konteksti (mavzu nomi va matni) asosida ber. Savol darsdan tashqarida bo'lsa ham yordam ber, lekin qisqa bo'l.
- Soddadan murakkabga: tushunchani oddiy tilda, real hayotiy misol yoki analogiya bilan tushuntir.
- AKADEMIK HALOLLIK: agar talaba uy vazifasi, test yoki nazorat savolining tayyor javobini so'rasa — TAYYOR JAVOBNI BERMA. Buning o'rniga yo'naltiruvchi savollar ber, qadamlarni ko'rsat, maslahat ber, toki talaba o'zi yechsin.
- Qisqa va aniq bo'l: qisqa xatboshi va zarur bo'lsa ro'yxat ishlat. Ortiqcha emoji ishlatma.
- Rag'batlantiruvchi, sabrli ohangda yoz. Talabani kamsitma.
- Aniq bilmasang, taxmin qilma — o'qituvchidan so'rashni maslahat ber.`;

function modeInstruction(mode: Mode): string {
  switch (mode) {
    case 'explain':
      return "Ushbu mavzuning asosiy tushunchasini talabaga sodda tilda, misol bilan tushuntir.";
    case 'practice':
      return "Ushbu mavzu bo'yicha 3-5 ta mashq savoli tuz. Har biriga qisqa yechim/javobni oxirida alohida ('Javoblar:' sarlavhasi ostida) ber, toki talaba avval o'zi urinib ko'rsin.";
    case 'hint':
      return "Talaba masalani yechishda qiynalyapti. Tayyor javob BERMA — faqat keyingi qadamni topishga yordam beradigan maslahat yoki yo'naltiruvchi savol ber.";
    default:
      return "Talabaning savoliga dars konteksti asosida aniq javob ber.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireStudent(req);

    // 1) Obuna gate
    const subscribed = await hasActiveSubscription(session.sub);
    if (!subscribed) {
      return jsonResponse(
        {
          error: "AI o'quv yordamchisi obuna bilan ishlaydi. Obuna bo'lib, cheksiz yordam oling.",
          code: 'SUBSCRIPTION_REQUIRED',
        },
        { status: 403 },
      );
    }

    // 2) AI sozlanganmi
    if (!isAnthropicConfigured()) {
      return jsonResponse(
        { error: "AI hozircha sozlanmagan. Iltimos keyinroq urinib ko'ring.", code: 'AI_NOT_CONFIGURED' },
        { status: 503 },
      );
    }

    // 3) Kunlik limit (O'zbekiston kalendar kuni bo'yicha — UTC EMAS).
    // Aks holda limit 05:00 (mahalliy)da yangilanadi va 00:00–05:00 oraliq
    // oldingi kunga hisoblanadi.
    const day = platformDayIso(platformDayLabel());
    const rl = await checkRateLimit(`ai-tutor:${session.sub}:${day}`, DAILY_LIMIT, DAY_MS);
    if (!rl.allowed) {
      return jsonResponse(
        {
          error: `Bugungi AI yordam limiti tugadi (${DAILY_LIMIT} ta). Ertaga yana davom eting.`,
          code: 'DAILY_LIMIT_REACHED',
          remaining: 0,
        },
        { status: 429 },
      );
    }

    // 4) Input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const question = typeof b.question === 'string' ? b.question.trim().slice(0, MAX_QUESTION) : '';
    const mode: Mode = MODES.includes(b.mode as Mode) ? (b.mode as Mode) : 'ask';
    const topicTitle = typeof b.topicTitle === 'string' ? b.topicTitle.trim().slice(0, 300) : '';
    const courseTitle = typeof b.courseTitle === 'string' ? b.courseTitle.trim().slice(0, 300) : '';
    const topicContent =
      typeof b.topicContent === 'string' ? toPlainText(b.topicContent, MAX_CONTEXT_CHARS) : '';

    if (mode === 'ask' && question.length < 2) {
      throw new ValidationError('Savol kamida 2 belgi bo\'lishi kerak');
    }

    // Suhbat tarixi (cheklangan)
    const history = (Array.isArray(b.history) ? b.history : [])
      .map((m) => (m && typeof m === 'object' ? (m as Record<string, unknown>) : {}))
      .filter(
        (m): m is { role: 'user' | 'assistant'; content: string } =>
          (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
      )
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    // 5) Prompt qurish
    const context = [
      courseTitle ? `Kurs: ${courseTitle}` : '',
      topicTitle ? `Mavzu: ${topicTitle}` : '',
      topicContent ? `Mavzu matni:\n${topicContent}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const userContent = [
      context ? `[Dars konteksti]\n${context}\n` : '',
      `[Vazifa] ${modeInstruction(mode)}`,
      question ? `\n[Talaba savoli] ${question}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const messages = [
      ...history,
      { role: 'user' as const, content: userContent },
    ];

    const { text } = await complete({
      system: SYSTEM_PROMPT,
      messages,
      maxTokens: 900,
      temperature: 0.6,
    });

    return jsonResponse({ answer: text, remaining: rl.remaining });
  } catch (err) {
    return errorResponse(err);
  }
}
