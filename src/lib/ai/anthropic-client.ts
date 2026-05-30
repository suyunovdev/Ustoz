/**
 * Anthropic Claude API wrapper — kichik, qayta ishlatish uchun.
 *
 * Env: ANTHROPIC_API_KEY
 * Model: claude-haiku-4-5 (eng arzon, tez)
 */

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export function isAnthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key.length > 10 && !key.startsWith('your-'));
}

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function complete(input: {
  system?: string;
  messages: AnthropicMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<{ text: string; usage?: { input: number; output: number } }> {
  if (!isAnthropicConfigured()) {
    throw new Error('ANTHROPIC_API_KEY environment\'da sozlanmagan');
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: input.maxTokens ?? 1024,
      temperature: input.temperature ?? 0.7,
      ...(input.system ? { system: input.system } : {}),
      messages: input.messages,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(`Anthropic API: ${msg}`);
  }

  // Response: { content: [{ type: 'text', text: '...' }], usage: {...} }
  const text =
    Array.isArray(data?.content)
      ? data.content
          .filter((b: any) => b?.type === 'text')
          .map((b: any) => b.text)
          .join('\n')
      : '';
  return {
    text: text.trim(),
    usage: data?.usage
      ? { input: data.usage.input_tokens, output: data.usage.output_tokens }
      : undefined,
  };
}
