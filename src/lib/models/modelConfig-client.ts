// Client-safe model configuration
// This file avoids server-side imports to work in browser environments

// Available model names - these should match the models in app-config.json
export const AVAILABLE_MODELS = [
  'gpt-4o-2024-11-20',
  'gpt-4.1-2025-04-14',
  'gpt-4.5-preview-2025-02-27',
  'gpt-4.1-mini-2025-04-14',
  'gpt-4o-mini-2024-07-18',
  'gpt-4.1-nano-2025-04-14',
  'o3-mini-2025-01-31',
  'o4-mini-2025-04-16',
  'o3-2025-04-16'
];

// Remove modelUtils import to avoid client-side bundling issues

// Legacy interface for backward compatibility
export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
  };
  isReasoning?: boolean;
}

// Basic model configurations for client use
export const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: 'gpt-4.1-2025-04-14',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 },
    isReasoning: false
  },
  {
    name: 'gpt-4.5-preview-2025-02-27',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 },
    isReasoning: false
  },
  {
    name: 'gpt-4o-2024-11-20',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 },
    isReasoning: false
  },
  {
    name: 'gpt-4.1-mini-2025-04-14',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 },
    isReasoning: false
  },
  {
    name: 'gpt-4o-mini-2024-07-18',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 },
    isReasoning: false
  },
  {
    name: 'gpt-4.1-nano-2025-04-14',
    provider: 'openai',
    defaultParams: { temperature: 0.7, max_tokens: 1024 },
    isReasoning: false
  },
  {
    name: 'o3-mini-2025-01-31',
    provider: 'openai',
    defaultParams: { max_tokens: 1024 }, // No temperature for reasoning models
    isReasoning: true
  },
  {
    name: 'o4-mini-2025-04-16',
    provider: 'openai',
    defaultParams: { max_tokens: 1024 }, // No temperature for reasoning models
    isReasoning: true
  },
  {
    name: 'o3-2025-04-16',
    provider: 'openai',
    defaultParams: { max_tokens: 1024 }, // No temperature for reasoning models
    isReasoning: true
  }
];

// Get specific model configuration by name
export function getModelConfig(name: string): ModelConfig | undefined {
  return MODEL_CONFIGS.find(config => config.name === name);
}

// Client-side helper to check if a model is a reasoning model
export function isReasoningModel(modelName: string): boolean {
  const config = getModelConfig(modelName);
  if (config?.isReasoning !== undefined) {
    return config.isReasoning;
  }
  // Fallback: use naming patterns for o-series models
  return /^(o1|o1-mini|o3|o3-mini|o4-mini)(-.*)?$/.test(modelName);
}

// Get default reasoning effort for a model (client-side)
export function getDefaultReasoningEffort(modelName: string): 'low' | 'medium' | 'high' | undefined {
  if (!isReasoningModel(modelName)) return undefined;
  
  // Special case: o1 models don't support reasoning_effort parameter
  if (modelName.startsWith('o1')) return undefined;
  
  // Return 'medium' as the global default (from config)
  return 'medium';
}

// Get model display information for UI
export function getModelDisplayInfo(modelName: string) {
  const config = getModelConfig(modelName);
  const isReasoning = config?.isReasoning || false;
  
  return {
    name: modelName,
    provider: config?.provider || 'openai',
    isReasoning,
    supportsTemperature: !isReasoning,
    supportsReasoningEffort: isReasoning,
    defaultReasoningEffort: getDefaultReasoningEffort(modelName),
  };
} 