# OpenAI Reasoning Models Integration

This document explains the integration of OpenAI's reasoning models (o-series) and non-reasoning models (GPT-4 family) in the Creative Writing Evaluation Arena.

## Overview

OpenAI's model family consists of two distinct types:
- **Non-reasoning models**: GPT-4, GPT-4o, GPT-4-mini family
- **Reasoning models**: o-series (o1, o3, o4-mini, etc.)

These model families have different API requirements and capabilities.

## Key Differences

### Request Parameters

| Parameter | GPT-4 Family | o-series (Reasoning) |
|-----------|--------------|----------------------|
| Token limit | `max_tokens` | `max_completion_tokens` |
| Temperature | ✅ Supported | ❌ Not supported |
| top_p | ✅ Supported | ❌ Not supported |
| Sampling controls | ✅ Supported | ❌ Not supported |
| Reasoning effort | ❌ N/A | ✅ `low`, `medium`, `high` |
| System messages | `role: "system"` | `role: "developer"` |

### Response Structure

| Field | GPT-4 Family | o-series |
|-------|--------------|----------|
| `completion_tokens` | Visible tokens only | Visible + reasoning tokens |
| `reasoning_tokens` | Not present | Hidden CoT tokens |

## Implementation

### Core Wrapper (`src/lib/ai/openaiWrapper.ts`)

The unified wrapper automatically detects model type and adjusts parameters:

```typescript
import { chat, isReasoningModel } from '../lib/ai/openaiWrapper';

// Automatically handles both model types
const response = await chat({
  model: 'o3-mini-high-2025-01-31', // or 'gpt-4o-2024-11-20'
  messages: [
    { role: 'system', content: 'You are a creative writer' },
    { role: 'user', content: 'Write a story about...' }
  ],
  max_tokens: 1000,
  temperature: 0.7, // Ignored for reasoning models
  reasoning_effort: 'medium' // Ignored for non-reasoning models
});
```

### Model Detection

```typescript
import { isReasoningModel, getDefaultReasoningEffort } from '../lib/models/modelConfig-client';

// Client-side detection
const isO3 = isReasoningModel('o3-2025-04-16'); // true
const isGPT4 = isReasoningModel('gpt-4o-2024-11-20'); // false

// Default reasoning effort
const effort = getDefaultReasoningEffort('o3-mini-high-2025-01-31'); // 'low'
```

### Integration Points

1. **AI Service** (`src/lib/models/aiService.ts`)
   - Updated to use unified wrapper
   - Automatic parameter translation

2. **Unified Request Builder** (`src/lib/ai/unifiedRequestBuilder.ts`)
   - Handles system/developer message roles
   - Parameter filtering for reasoning models

3. **API Routes**
   - `src/app/api/generate-openai/route.ts`
   - `src/app/api/speed-mode-bulk/route.ts`

## Current Model Configuration

### Non-Reasoning Models (GPT-4 Family)
- `gpt-4.1-2025-04-14` - Flagship LLM
- `gpt-4.5-preview-2025-02-27` - Research preview
- `gpt-4o-2024-11-20` - Multimodal flagship
- `gpt-4.1-mini-2025-04-14` - 80% quality, lower latency
- `gpt-4o-mini-2024-07-18` - Cost-efficient
- `gpt-4.1-nano-2025-04-14` - Fastest GPT-4-grade

### Reasoning Models (o-series)
- `o3-mini-high-2025-01-31` - Reasoning-tuned, structured prose
- `o4-mini-high-2025-04-16` - Chain-of-thought with image awareness
- `o3-2025-04-16` - Full reasoning model for analytical writing

## Benefits

1. **Unified Interface**: One API for all OpenAI models
2. **Automatic Parameter Handling**: No manual parameter filtering needed
3. **Proper Token Accounting**: Correct billing/usage metrics
4. **Future-Proof**: Easy to add new reasoning models
5. **Error Prevention**: Avoids API rejections from unsupported parameters

## Usage in Game Modes

Both human vs. machine and machine vs. machine interfaces now support:
- Seamless model switching between reasoning and non-reasoning models
- Appropriate parameter sets for each model type
- Consistent response handling regardless of model family
- Proper error handling and timeout protection

## Testing

The wrapper has been integrated into all game modes:
- ✅ ModelEvaluationArena (machine vs machine)
- ✅ HumanMachineArena (human vs machine)
- ✅ HumanEvaluationArena (human evaluation)
- ✅ SpeedModeArena (speed evaluation)

All models are properly configured and enabled in the system configuration.