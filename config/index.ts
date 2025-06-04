import fs from 'fs';
import path from 'path';

// Type definitions for the configuration
export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  displayName: string;
  description: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  systemInstruction: string;
}

export interface AppConfig {
  app: {
    name: string;
    version: string;
    debugMode: boolean;
    environment: string;
  };
  features: {
    authentication: {
      enabled: boolean;
      disableForAnonymous: boolean;
      requireEmailConfirmation: boolean;
    };
    dashboard: {
      enabled: boolean;
      showLink: boolean;
    };
    leaderboard: {
      enabled: boolean;
      showDateFilters: boolean;
    };
    resources: {
      enabled: boolean;
    };
    dataset: {
      enabled: boolean;
      downloadUrl: string | null;
    };
    ui: {
      showHelpButton: boolean;
      enableDarkMode: boolean;
      defaultTheme: string;
    };
  };
  models: {
    defaultProvider: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    configurations: ModelConfig[];
  };
  api: {
    rateLimit: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
    caching: {
      enabled: boolean;
      ttlMs: number;
    };
  };
  database: {
    maxPromptsPerUser: number;
    enableContentReports: boolean;
    enableDatasetDownloads: boolean;
  };
  analytics: {
    enabled: boolean;
    provider: string | null;
    trackingId: string | null;
  };
  security: {
    enableCORS: boolean;
    allowedOrigins: string[];
    enableRateLimiting: boolean;
  };
}

// Cache for the loaded configuration
let cachedConfig: AppConfig | null = null;

// Load configuration from JSON file
function loadConfig(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'app-config.json');
  
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    cachedConfig = JSON.parse(configFile) as AppConfig;
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw new Error(`Configuration file not found or invalid: ${configPath}`);
  }
}

// Get the full configuration
export function getConfig(): AppConfig {
  return loadConfig();
}

// Convenience functions for commonly used config sections
export function getAppConfig() {
  return getConfig().app;
}

export function getFeatureConfig() {
  return getConfig().features;
}

export function getModelConfigs(): ModelConfig[] {
  return getConfig().models.configurations.filter(model => model.enabled);
}

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return getConfig().models.configurations.find(model => model.id === modelId);
}

export function getAvailableModels(): string[] {
  return getModelConfigs().map(model => model.id);
}

export function getSystemInstruction(modelId: string): string {
  const model = getModelConfig(modelId);
  return model?.systemInstruction || getConfig().models.configurations.find(m => m.id === 'gpt-4o')?.systemInstruction || 'You are a creative writing assistant.';
}

// Legacy interface for backward compatibility
export interface LegacyAppConfig {
  debugMode: boolean;
  enableDashboard: boolean;
  showDashboardLink: boolean;
  enableLeaderboard: boolean;
  showLeaderboardDateFilters: boolean;
  enableResources: boolean;
  enableDataset: boolean;
  showHelpButton: boolean;
  disableAuthentication: boolean;
}

// Export legacy config for backward compatibility
export const config: LegacyAppConfig = {
  get debugMode() { return getConfig().app.debugMode; },
  get enableDashboard() { return getConfig().features.dashboard.enabled; },
  get showDashboardLink() { return getConfig().features.dashboard.showLink; },
  get enableLeaderboard() { return getConfig().features.leaderboard.enabled; },
  get showLeaderboardDateFilters() { return getConfig().features.leaderboard.showDateFilters; },
  get enableResources() { return getConfig().features.resources.enabled; },
  get enableDataset() { return getConfig().features.dataset.enabled; },
  get showHelpButton() { return getConfig().features.ui.showHelpButton; },
  get disableAuthentication() { return getConfig().features.authentication.disableForAnonymous; },
};

// Default export
export default config; 