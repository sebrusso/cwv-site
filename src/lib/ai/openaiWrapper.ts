// Server-side only OpenAI wrapper
// This file should only be imported in API routes and server-side code
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

// import { isReasoningModel } from '../models/modelUtils'; // Currently unused

let client: any = null;

// Lazy initialization to avoid issues with client-side bundling
function getOpenAIClient() {
  if (!client) {
    const { OpenAI } = require('openai');
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

// Regex pattern to detect o-series reasoning models
const O_SERIES_PATTERN = /^(o[1-9]|o[1-9]-mini|o[1-9]-.*|o[1-9].*-.*)/;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'developer';
  content: string;
}

export interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logprobs?: boolean;
  logit_bias?: Record<string, number>;
  stop?: string[];
  reasoning_effort?: 'low' | 'medium' | 'high';
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    output_tokens_details?: {
      reasoning_tokens?: number;
    };
  };
  // Normalized usage for consistent billing/metrics
  total_tokens_visible: number;
}

/**
 * Unified OpenAI chat completion wrapper that handles both reasoning and non-reasoning models
 */
export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const {
    model,
    messages,
    max_tokens = 2048,
    reasoning_effort,
    ...extra
  } = options;

  // Detect if this is a reasoning model
  const isReasoning = O_SERIES_PATTERN.test(model);
  
  // Transform messages for reasoning models (system -> user for older models, developer for newer ones)
  const transformedMessages = messages.map(msg => {
    if (msg.role === 'system' && isReasoning) {
      // o1 and o1-mini don't support system messages at all, so convert to user message
      if (model.startsWith('o1')) {
        return { ...msg, role: 'user', content: `System instruction: ${msg.content}` };
      }
      // Newer o3/o4 models support developer role
      return { ...msg, role: 'developer' };
    }
    return msg;
  });

  // Build request parameters based on model type
  const requestParams: Record<string, unknown> = {
    model,
    messages: transformedMessages,
  };

  if (isReasoning) {
    // Reasoning model parameters
    requestParams.max_completion_tokens = max_tokens;
    
    // Add reasoning effort if specified
    if (reasoning_effort) {
      requestParams.reasoning_effort = reasoning_effort;
    }
    
    // Remove unsupported parameters for reasoning models
    // (temperature, top_p, presence_penalty, frequency_penalty, logprobs, logit_bias are not supported)
  } else {
    // Non-reasoning model parameters
    requestParams.max_tokens = max_tokens;
    
    // Add sampling parameters if provided
    if (extra.temperature !== undefined) requestParams.temperature = extra.temperature;
    if (extra.top_p !== undefined) requestParams.top_p = extra.top_p;
    if (extra.presence_penalty !== undefined) requestParams.presence_penalty = extra.presence_penalty;
    if (extra.frequency_penalty !== undefined) requestParams.frequency_penalty = extra.frequency_penalty;
    if (extra.logprobs !== undefined) requestParams.logprobs = extra.logprobs;
    if (extra.logit_bias !== undefined) requestParams.logit_bias = extra.logit_bias;
  }

  // Add common parameters that work for both model types
  if (extra.stop) requestParams.stop = extra.stop;
  if (extra.stream !== undefined) requestParams.stream = extra.stream;

  // Make the API call
  const openaiClient = getOpenAIClient();
  const response = await openaiClient.chat.completions.create(requestParams);

  // Normalize usage for consistent billing/metrics
  const usage = response.usage!;
  const visibleTokens = usage.completion_tokens;
  const reasoningTokens = usage.output_tokens_details?.reasoning_tokens || 0;
  
  // For reasoning models, completion_tokens includes both visible and reasoning tokens
  // For non-reasoning models, completion_tokens is just visible tokens
  const totalTokensVisible = isReasoning ? visibleTokens - reasoningTokens : visibleTokens;

  return {
    ...response,
    total_tokens_visible: totalTokensVisible,
  } as ChatResponse;
}

/**
 * Simplified wrapper for basic text generation (backward compatibility)
 */
export async function generateText(
  prompt: string,
  model: string,
  systemMessage?: string,
  options: Partial<ChatOptions> = {}
): Promise<string> {
  const messages: ChatMessage[] = [];
  
  if (systemMessage) {
    messages.push({ role: 'system', content: systemMessage });
  }
  
  messages.push({ role: 'user', content: prompt });

  const response = await chat({
    model,
    messages,
    ...options,
  });

  return response.choices[0]?.message?.content || '';
}

 