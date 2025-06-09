// Client-safe model utility functions
// This file can be safely imported in both client and server code

/**
 * Helper function to check if a model is a reasoning model
 * Uses model name patterns as fallback when config is not available
 */
export function isReasoningModel(modelId: string): boolean {
  // For client-side compatibility, use naming patterns
  // This matches the o-series models (o1, o1-mini, o3, o3-mini, o4-mini with optional date suffixes)
  return /^(o1|o1-mini|o3|o3-mini|o4-mini)(-.*)?$/.test(modelId);
}

/**
 * Get default reasoning effort for a model
 * Returns 'medium' as the global default for reasoning models (except o1 variants)
 */
export function getDefaultReasoningEffort(modelId: string): 'low' | 'medium' | 'high' | undefined {
  if (!isReasoningModel(modelId)) return undefined;
  
  // Special case: o1 models don't support reasoning_effort parameter
  if (modelId.startsWith('o1')) return undefined;
  
  // Return 'medium' as the global default (from config)
  return 'medium';
}

/**
 * Get model display information for UI
 */
export function getModelDisplayInfo(modelId: string) {
  const isReasoning = isReasoningModel(modelId);
  
  return {
    name: modelId,
    isReasoning,
    supportsTemperature: !isReasoning,
    supportsReasoningEffort: isReasoning && !modelId.startsWith('o1'),
    defaultReasoningEffort: getDefaultReasoningEffort(modelId),
  };
}

// Note: This file now uses naming patterns instead of config for client-safe compatibility
// The global default reasoning effort 'medium' is hardcoded to match the config value 