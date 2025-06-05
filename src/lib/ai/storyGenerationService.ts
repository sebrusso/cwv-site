import { buildUnifiedChatRequest } from './unifiedRequestBuilder';
import { buildSystemInstruction } from './systemInstructionBuilder';
import { generateText } from '../models/aiService';
import { getServerConfig } from '../server-config';

export interface StoryGenerationContext {
  prompt: string;
  model: string;
  referenceStory?: string;
  generationType: 'human-vs-machine' | 'model-vs-model';
  enhancedInstructions?: {
    targetLength?: 'short' | 'medium' | 'long';
    genre?: 'literary' | 'adventure' | 'mystery' | 'romance' | 'sci-fi';
    tone?: 'dramatic' | 'humorous' | 'suspenseful' | 'heartwarming';
    complexity?: 'simple' | 'nuanced' | 'complex';
  };
}

export interface GeneratedStory {
  text: string;
  metadata: {
    wordCount: number;
    model: string;
    generationType: string;
    targetLength?: string;
  };
}

/**
 * Unified story generation service that handles both human-vs-machine and model-vs-model scenarios
 */
export async function generateStory(
  fetchFn: typeof fetch,
  context: StoryGenerationContext
): Promise<GeneratedStory> {
  
  if (context.generationType === 'human-vs-machine' && context.referenceStory) {
    // Use sophisticated reference-aware generation
    return generateReferenceAwareStory(fetchFn, context);
  } else {
    // Use enhanced standalone generation for model-vs-model
    return generateEnhancedStory(fetchFn, context);
  }
}

/**
 * Generate story with reference story awareness (human-vs-machine)
 */
async function generateReferenceAwareStory(
  fetchFn: typeof fetch,
  context: StoryGenerationContext
): Promise<GeneratedStory> {
  
  const request = buildUnifiedChatRequest({
    prompt: context.prompt,
    model: context.model,
    referenceStory: context.referenceStory
  });

  const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API request failed: ${errorText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const cleanText = text.replace(/<\|endofstory\|>/g, '').trim();

  return {
    text: cleanText,
    metadata: {
      wordCount: cleanText.split(/\s+/).length,
      model: context.model,
      generationType: context.generationType,
    }
  };
}

/**
 * Generate enhanced story for model-vs-model with sophisticated instructions
 */
async function generateEnhancedStory(
  fetchFn: typeof fetch,
  context: StoryGenerationContext
): Promise<GeneratedStory> {
  
  const enhancedSystemInstruction = buildEnhancedModelVsModelInstruction(context);
  const enhancedParams = getEnhancedParameters();

  const text = await generateText(fetchFn, {
    prompt: context.prompt,
    model: context.model,
    systemMessage: enhancedSystemInstruction,
    params: enhancedParams
  });

  return {
    text,
    metadata: {
      wordCount: text.split(/\s+/).length,
      model: context.model,
      generationType: context.generationType,
      targetLength: context.enhancedInstructions?.targetLength
    }
  };
}

/**
 * Build sophisticated system instructions for model-vs-model comparisons
 */
function buildEnhancedModelVsModelInstruction(context: StoryGenerationContext): string {
  const baseInstruction = buildSystemInstruction({ model: context.model });
  const enhanced = context.enhancedInstructions;
  
  if (!enhanced) {
    return baseInstruction;
  }

  const lengthGuidance = getLengthGuidance(enhanced.targetLength || 'medium');
  const genreGuidance = enhanced.genre ? getGenreGuidance(enhanced.genre) : '';
  const toneGuidance = enhanced.tone ? getToneGuidance(enhanced.tone) : '';
  const complexityGuidance = enhanced.complexity ? getComplexityGuidance(enhanced.complexity) : '';

  return `${baseInstruction}

ENHANCED STORY REQUIREMENTS:
${lengthGuidance}
${genreGuidance}
${toneGuidance}
${complexityGuidance}

Focus on creating a compelling, complete narrative that showcases sophisticated storytelling while meeting these enhanced requirements. The story should be engaging enough that readers will find it interesting to evaluate against other AI-generated stories.

End your story with: <|endofstory|>`;
}

function getLengthGuidance(targetLength: string): string {
  switch (targetLength) {
    case 'short':
      return '- Write a concise but complete story in 2-3 paragraphs (150-250 words)';
    case 'medium':
      return '- Write a well-developed story in 4-6 paragraphs (300-500 words)';
    case 'long':
      return '- Write an engaging, detailed story in 6-10 paragraphs (500-800 words)';
    default:
      return '- Write a complete story in 3-5 paragraphs (200-400 words)';
  }
}

function getGenreGuidance(genre: string): string {
  const genreMap = {
    literary: '- Focus on character development, themes, and literary quality',
    adventure: '- Include action, excitement, and dynamic plot progression',
    mystery: '- Build suspense with clues, tension, and intriguing elements',
    romance: '- Emphasize emotional connections and relationship dynamics',
    'sci-fi': '- Incorporate futuristic or scientific elements thoughtfully'
  };
  return genreMap[genre as keyof typeof genreMap] || '';
}

function getToneGuidance(tone: string): string {
  const toneMap = {
    dramatic: '- Maintain emotional intensity and significant stakes',
    humorous: '- Include wit, levity, or amusing situations naturally',
    suspenseful: '- Build tension and keep readers engaged with uncertainty',
    heartwarming: '- Focus on positive emotions and uplifting moments'
  };
  return toneMap[tone as keyof typeof toneMap] || '';
}

function getComplexityGuidance(complexity: string): string {
  const complexityMap = {
    simple: '- Use clear, straightforward narrative structure and language',
    nuanced: '- Include subtle character motivations and layered storytelling',
    complex: '- Weave multiple themes, sophisticated plot elements, and rich character development'
  };
  return complexityMap[complexity as keyof typeof complexityMap] || '';
}

function getEnhancedParameters() {
  const config = getServerConfig();
  
  return {
    temperature: 0.8, // Higher for more creative model-vs-model stories
    max_tokens: config.models.defaultMaxTokens, // Use global max tokens setting for consistency
    stop: ['<|endofstory|>', '\n\n\n'] // Stop at end token or excessive spacing
  };
} 