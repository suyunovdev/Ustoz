/**
 * POST /api/teacher/ai/topic-description
 * Mavzu titulidan tavsif generatsiya qiladi.
 *
 * Body:
 *   { title: string, courseTitle?: string, courseDescription?: string }
 *
 * Response:
 *   { description: string }
 *
 * Auth: faqat teacher / admin.
 * Anthropic API ishlatadi (key sozlanmagan bo'lsa, 503).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { complete, isAnthropicConfigured } from '@/lib/ai/anthropic-client';

export async function POST(req: NextRequest) {
  try {
    await requireTeacherOrAdmin(req);

    if (!isAnthropicConfigured()) {
      return jsonResponse(
        {
          error: "AI sozlanmagan — ANTHROPIC_API_KEY environment'ga qo'shilishi kerak",
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const title = typeof b.title === 'string' ? b.title.trim() : '';
    const courseTitle = typeof b.courseTitle === 'string' ? b.courseTitle.trim() : '';
    const courseDescription =
      typeof b.courseDescription === 'string' ? b.courseDescription.trim() : '';

    if (title.length < 2) {
      throw new ValidationError("Mavzu nomi kamida 2 belgi");
    }

    const systemPrompt = `Sen o'zbek tilidagi onlayn ta'lim platformasi uchun ishlaydigan yordamchisan.
Foydalanuvchi (o'qituvchi) mavzu nomini beradi va sen unga qisqa, aniq, talabaga mos tavsif yozasan.
Qoidalar:
- Faqat o'zbek tilida yoz
- 2-3 jumla, maksimum 200 belgi
- Talabaga foydani aniq ko'rsat ("Siz o'rganasiz...", "Bu mavzu yordam beradi...")
- Foydalanuvchi ko'p emoji ishlatmaslikni xohlasa, ozgina ishlat
- Faqat tavsif matnini qaytar — kirish so'zsiz`;

    const userPrompt = [
      courseTitle ? `Kurs nomi: ${courseTitle}` : '',
      courseDescription ? `Kurs tavsifi: ${courseDescription}` : '',
      `Mavzu nomi: ${title}`,
      `Iltimos, bu mavzu uchun qisqa tavsif yoz.`,
    ]
      .filter(Boolean)
      .join('\n');

    const { text, usage } = await complete({
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxTokens: 300,
      temperature: 0.7,
    });

    return jsonResponse({
      description: text,
      usage,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
