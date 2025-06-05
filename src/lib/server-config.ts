// Server-side configuration that can use Node.js modules
// This file should only be imported by server-side code (API routes, server components)

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
  enabled: boolean;
  customSystemInstruction: string | null;
}

export interface ServerAppConfig {
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
    defaultSystemInstruction: string;
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
let cachedConfig: ServerAppConfig | null = null;

// Load configuration from JSON file
function loadConfig(): ServerAppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), 'config', 'app-config.json');
  
  try {
    const configFile = fs.readFileSync(configPath, 'utf8');
    cachedConfig = JSON.parse(configFile) as ServerAppConfig;
    return cachedConfig;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw new Error(`Configuration file not found or invalid: ${configPath}`);
  }
}

// Get the full configuration
export function getServerConfig(): ServerAppConfig {
  return loadConfig();
}

// Convenience functions for commonly used config sections
export function getAppConfig() {
  return getServerConfig().app;
}

export function getFeatureConfig() {
  return getServerConfig().features;
}

export function getModelConfigs(): ModelConfig[] {
  return getServerConfig().models.configurations.filter(model => model.enabled);
}

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return getServerConfig().models.configurations.find(model => model.id === modelId);
}

export function getAvailableModels(): string[] {
  return getModelConfigs().map(model => model.id);
}

export function getSystemInstruction(modelId: string): string {
  const model = getModelConfig(modelId);
  const config = getServerConfig();
  return model?.customSystemInstruction || config.models.defaultSystemInstruction || 'You are a creative writing assistant.';
}

// Legacy interface for backward compatibility in server-side code
export interface LegacyServerAppConfig {
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

// Export legacy config for backward compatibility in server-side code
export const serverConfig: LegacyServerAppConfig = {
  get debugMode() { return getServerConfig().app.debugMode; },
  get enableDashboard() { return getServerConfig().features.dashboard.enabled; },
  get showDashboardLink() { return getServerConfig().features.dashboard.showLink; },
  get enableLeaderboard() { return getServerConfig().features.leaderboard.enabled; },
  get showLeaderboardDateFilters() { return getServerConfig().features.leaderboard.showDateFilters; },
  get enableResources() { return getServerConfig().features.resources.enabled; },
  get enableDataset() { return getServerConfig().features.dataset.enabled; },
  get showHelpButton() { return getServerConfig().features.ui.showHelpButton; },
  get disableAuthentication() { return getServerConfig().features.authentication.disableForAnonymous; },
}; 