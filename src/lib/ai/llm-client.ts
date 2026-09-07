/**
 * Provayder-agnostik LLM qatlami — qaysi kalit sozlangan bo'lsa o'shani ishlatadi.
 *
 * Ustuvorlik: Gemini (GEMINI_API_KEY) -> Anthropic (ANTHROPIC_API_KEY).
 * Ikkalasi ham bo'lmasa `isAiConfigured()` false qaytaradi — chaqiruvchilar
 * bunday holatda AI'siz ishlaydigan (graceful) javob berishi kerak.
 */
import type { AnthropicMessage } from './anthropic-client';
import { complete as completeAnthropic, isAnthropicConfigured } from './anthropic-client';
import { completeGemini, isGeminiConfigured } from './gemini-client';

export type { AnthropicMessage };
export type LlmProvider = 'gemini' | 'anthropic' | 'none';

export function aiProvider(): LlmProvider {
  if (isGeminiConfigured()) return 'gemini';
  if (isAnthropicConfigured()) return 'anthropic';
  return 'none';
}

export function isAiConfigured(): boolean {
  return aiProvider() !== 'none';
}

export async function complete(input: {
  system?: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; usage?: { input: number; output: number } }> {
  const provider = aiProvider();
  if (provider === 'gemini') return completeGemini(input);
  if (provider === 'anthropic') return completeAnthropic(input);
  throw new Error('AI sozlanmagan: GEMINI_API_KEY yoki ANTHROPIC_API_KEY kerak');
}
