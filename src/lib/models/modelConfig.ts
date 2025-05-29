export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
  };
}

export const MODEL_CONFIGS: ModelConfig[] = [
  { name: 'gpt-4.1', provider: 'openai', defaultParams: { temperature: 0.7, max_tokens: 512 } },
  { name: 'gpt-4o', provider: 'openai', defaultParams: { temperature: 0.7, max_tokens: 256 } },
  { name: 'gpt-4o-mini', provider: 'openai', defaultParams: { temperature: 0.7, max_tokens: 256 } },
  { name: 'gpt-4-turbo', provider: 'openai', defaultParams: { temperature: 0.7, max_tokens: 256 } },
  { name: 'gpt-3.5-turbo', provider: 'openai', defaultParams: { temperature: 0.7, max_tokens: 256 } },
  { name: 'claude-3-opus', provider: 'anthropic', defaultParams: { temperature: 0.7, max_tokens: 256 } },
  { name: 'gemini-pro', provider: 'google', defaultParams: { temperature: 0.7, max_tokens: 256 } },
];

export function getModelConfig(name: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find((m) => m.name === name);
}

export const AVAILABLE_MODELS = MODEL_CONFIGS.map((m) => m.name);
