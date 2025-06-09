import { getModelConfig } from './modelConfig';
import { truncateToSentence } from '../utils';
import { chat } from '../ai/openaiWrapper';
import { getDefaultReasoningEffort } from './modelUtils';

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
      try {
        // Use the new unified OpenAI wrapper
        const messages = [
          {
            role: 'system' as const,
            content: systemMessage || 'You are an assistant generating a short creative writing sample based on the user prompt.',
          },
          { role: 'user' as const, content: prompt },
        ];

        // Use the client-safe reasoning effort function (which returns 'medium' as global default)
        const reasoningEffort = getDefaultReasoningEffort(config.name);

        const response = await chat({
          model: config.name,
          messages,
          max_tokens: opts.max_tokens,
          temperature: opts.temperature,
          stop: opts.stop,
          reasoning_effort: reasoningEffort,
        });

        const text = response.choices[0]?.message?.content || '';
        const { text: sentence } = truncateToSentence(text);
        if (!sentence) {
          throw new Error('Generation ended mid-sentence');
        }
        return sentence;
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
      }
    }
    default:
      throw new Error(`Provider ${config.provider} not implemented`);
  }
}
