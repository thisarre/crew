/**
 * Wrapper OpenAI minimal — fetch direct, pas de SDK.
 *
 * Activation : poser OPENAI_API_KEY dans .env.local
 * Modèle par défaut : gpt-4o-mini (rapide, bon marché, bon en français)
 * Override : OPENAI_MODEL=gpt-4o
 *
 * Si la clé est absente, on bascule sur le mock déterministe (voir ./mock.ts).
 */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
};

export type ChatResult = {
  content: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
};

const DEFAULT_MODEL = 'gpt-4o-mini';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const hasOpenAIKey = () => Boolean(process.env.OPENAI_API_KEY);

export const isAiMockMode = () => process.env.AI_MOCK === 'true' || !hasOpenAIKey();

export async function chatComplete(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY manquant — exporter la clé ou activer AI_MOCK=true');
  }

  const model = opts.model ?? process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.5,
  };
  if (opts.maxTokens) payload.max_tokens = opts.maxTokens;
  if (opts.jsonMode) payload.response_format = { type: 'json_object' };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI ${res.status}: ${text || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
    model: string;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  };

  const content = data.choices?.[0]?.message?.content ?? '';
  return {
    content,
    model: data.model,
    usage: data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Wrapper qui parse une réponse en JSON typé.
 * Pose toujours `jsonMode: true` automatiquement.
 */
export async function chatCompleteJson<T>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<T> {
  const { content } = await chatComplete(messages, { ...opts, jsonMode: true });
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error(`OpenAI a renvoyé un JSON invalide: ${content.slice(0, 200)}`);
  }
}
