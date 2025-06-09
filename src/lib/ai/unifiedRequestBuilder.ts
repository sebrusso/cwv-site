import { buildSystemInstruction, getOptimizedParameters } from './systemInstructionBuilder';
import { getServerConfig } from '../server-config';
import { isReasoningModel, getDefaultReasoningEffort } from '../models/modelUtils';

export interface UnifiedChatRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant" | "developer";
    content: string;
  }>;
  max_tokens?: number;
  max_completion_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string[];
  reasoning_effort?: 'low' | 'medium' | 'high';
}

export interface GenerationContext {
  prompt: string;
  model: string;
  referenceStory?: string;
  customSystemInstruction?: string;
  customParams?: {
    temperature?: number;
    max_tokens?: number;
    stop?: string[];
  };
}

export function buildUnifiedChatRequest(context: GenerationContext): UnifiedChatRequest {
  // Determine system instruction
  let systemInstruction: string;
  
  if (context.customSystemInstruction) {
    // Use provided custom instruction
    systemInstruction = context.customSystemInstruction;
  } else {
    // Use the unified system instruction builder
    systemInstruction = buildSystemInstruction({
      model: context.model,
      referenceStory: context.referenceStory
    });
  }
  
  // Get optimized parameters for the model
  const optimizedParams = getOptimizedParameters(context.model);
  
  // Determine max_tokens from global config
  const config = getServerConfig();
  const maxTokens = context.customParams?.max_tokens || config.models.defaultMaxTokens;
  
  // Check if this is a reasoning model
  const isReasoning = isReasoningModel(context.model);
  
  // Transform messages for reasoning models
  const messages: Array<{
    role: "system" | "user" | "assistant" | "developer";
    content: string;
  }> = [];
  
  // Handle system instruction based on model type
  if (isReasoning) {
    if (context.model.startsWith('o1')) {
      // o1 models don't support system messages, so convert to user message
      messages.push({ 
        role: "user", 
        content: `System instruction: ${systemInstruction}\n\nUser request: ${context.prompt}` 
      });
    } else {
      // Newer o3/o4 models support developer role
      messages.push({ role: "developer", content: systemInstruction });
      messages.push({ role: "user", content: context.prompt });
    }
  } else {
    // Non-reasoning models use normal system message
    messages.push({ role: "system", content: systemInstruction });
    messages.push({ role: "user", content: context.prompt });
  }
  
  // Build request based on model type
  const request: UnifiedChatRequest = {
    model: context.model,
    messages,
    stop: context.customParams?.stop || ["<|endofstory|>"]
  };
  
  if (isReasoning) {
    // Reasoning model parameters
    request.max_completion_tokens = maxTokens;
    request.reasoning_effort = getDefaultReasoningEffort(context.model);
    // Don't add sampling parameters (temperature, top_p, etc.) as they're not supported
  } else {
    // Non-reasoning model parameters
    request.max_tokens = maxTokens;
    request.temperature = context.customParams?.temperature ?? optimizedParams.temperature;
    request.top_p = optimizedParams.top_p;
    request.frequency_penalty = optimizedParams.frequency_penalty;
    request.presence_penalty = optimizedParams.presence_penalty;
  }
  
  return request;
}

// Legacy compatibility function
export function buildBalancedChatRequest(
  prompt: string,
  referenceStory: string,
  model: string = "gpt-4o"
): UnifiedChatRequest {
  return buildUnifiedChatRequest({
    prompt,
    model,
    referenceStory
  });
} 