import { buildSystemInstruction, getOptimizedParameters } from './systemInstructionBuilder';
import { getModelConfig as getConfigModelConfig } from '../../../config';

export interface UnifiedChatRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  max_tokens: number;
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  stop: string[];
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
  
  // Determine max_tokens from model config or default to 1024
  const modelConfig = getConfigModelConfig(context.model);
  const maxTokens = context.customParams?.max_tokens || modelConfig?.maxTokens || 1024;
  
  // Override with custom parameters if provided
  const finalParams = {
    temperature: context.customParams?.temperature ?? optimizedParams.temperature,
    top_p: optimizedParams.top_p,
    frequency_penalty: optimizedParams.frequency_penalty,
    presence_penalty: optimizedParams.presence_penalty,
  };
  
  return {
    model: context.model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: context.prompt }
    ],
    max_tokens: maxTokens,
    ...finalParams,
    stop: context.customParams?.stop || ["<|endofstory|>"]
  };
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