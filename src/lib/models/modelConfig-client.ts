// Client-safe model configuration
// This file avoids server-side imports to work in browser environments

// Available model names - these should match the models in app-config.json
export const AVAILABLE_MODELS = [
  'gpt-4.5-preview-2025-02-27',
  'gpt-4.1-preview-2024-12-05',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo'
];

// Legacy interface for backward compatibility
export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
  };
}

// Basic model configurations for client use
export const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: 'gpt-4.5-preview-2025-02-27',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 }
  },
  {
    name: 'gpt-4.1-preview-2024-12-05',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 }
  },
  {
    name: 'gpt-4o',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 }
  },
  {
    name: 'gpt-4o-mini',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 }
  },
  {
    name: 'gpt-4-turbo',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 }
  }
];

// Get specific model configuration by name
export function getModelConfig(name: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find(config => config.name === name);
} 