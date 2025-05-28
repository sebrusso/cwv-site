import { getModelConfig } from './modelConfig';
import { truncateToSentence } from '../utils';

export interface GenerateOptions {
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
}

export async function generateText(
  fetchFn: typeof fetch,
  {
    prompt,
    model,
    systemMessage,
    params,
  }: { prompt: string; model: string; systemMessage?: string; params?: GenerateOptions },
) {
  const config = getModelConfig(model);
  if (!config) {
    throw new Error(`Unknown model: ${model}`);
  }
  const opts = { ...config.defaultParams, ...params };

  switch (config.provider) {
    case 'openai': {
      const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: config.name,
          messages: [
            {
              role: 'system',
              content:
                systemMessage || 'You are an assistant generating a short creative writing sample based on the user prompt.',
            },
            { role: 'user', content: prompt },
          ],
          temperature: opts.temperature,
          max_tokens: opts.max_tokens,
          ...(opts.stop && { stop: opts.stop }),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      const data = await res.json();
      const choice = data.choices?.[0] || {};
      const text = choice.message?.content || '';
      const { text: sentence } = truncateToSentence(text);
      if (!sentence) {
        throw new Error('Generation ended mid-sentence');
      }
      return sentence;
    }
    default:
      throw new Error(`Provider ${config.provider} not implemented`);
  }
}
