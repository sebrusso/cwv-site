import { getModelConfigs, getAvailableModels, getModelConfig as getConfigModelConfig, getServerConfig, ModelConfig as ConfigModelConfig } from '../server-config';

// Legacy interface for backward compatibility
export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  defaultParams?: {
    temperature?: number;
    max_tokens?: number;
  };
}

// Convert new config format to legacy format
function convertToLegacyFormat(config: ConfigModelConfig): ModelConfig {
  const serverConfig = getServerConfig();
  return {
    name: config.id,
    provider: config.provider,
    defaultParams: {
      temperature: config.temperature ?? undefined,
      max_tokens: serverConfig.models.defaultMaxTokens,
    },
  };
}

// Get all model configurations in legacy format
export const MODEL_CONFIGS: ModelConfig[] = getModelConfigs().map(convertToLegacyFormat);

// Get specific model configuration by name
export function getModelConfig(name: string): ModelConfig | undefined {
  const config = getConfigModelConfig(name);
  return config ? convertToLegacyFormat(config) : undefined;
}

// Get all available model names
export const AVAILABLE_MODELS = getAvailableModels();
