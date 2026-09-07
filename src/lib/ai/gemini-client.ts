/**
 * Google Gemini API wrapper — Anthropic client bilan bir xil interfeys.
 *
 * Env: GEMINI_API_KEY (yoki GOOGLE_API_KEY), GEMINI_MODEL (ixtiyoriy)
 * Model: gemini-2.5-flash (tez, arzon). thinking o'chirilgan — past token
 * budjetida ham to'g'ri javob beradi (aks holda "thinking" tokenlar javobni yeb
 * bo'sh natija qaytarardi).
 */
import type { AnthropicMessage } from './anthropic-client';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function apiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
}

export function isGeminiConfigured(): boolean {
  const key = apiKey();
  return Boolean(key && key.length > 10 && !key.startsWith('your-'));
}

export async function completeGemini(input: {
  system?: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; usage?: { input: number; output: number } }> {
  const key = apiKey();
  if (!key) throw new Error('GEMINI_API_KEY environment\'da sozlanmagan');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const res = await fetch(`${endpoint}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...(input.system ? { systemInstruction: { parts: [{ text: input.system }] } } : {}),
      // Gemini rollari: 'user' | 'model' (Anthropic 'assistant' -> 'model')
      contents: input.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: {
        maxOutputTokens: input.maxTokens ?? 1024,
        temperature: input.temperature ?? 0.7,
        // "thinking" o'chirilgan — chiqish tokenlari faqat javobga ketadi
        // (2.5-flash thinking modeli past budjetda bo'sh javob berardi)
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Gemini API: ${msg}`);
  }

  // Response: { candidates: [{ content: { parts: [{text}] } }], usageMetadata: {...} }
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p?.text ?? '').join('\n')
    : '';
  const um = data?.usageMetadata;
  return {
    text: text.trim(),
    usage: um
      ? { input: um.promptTokenCount ?? 0, output: um.candidatesTokenCount ?? 0 }
      : undefined,
  };
}
