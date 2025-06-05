import { countWords, countParagraphs } from '../text-utils';
import { getSystemInstruction } from '../server-config';

export interface SystemInstructionContext {
  model: string;
  referenceStory?: string;
  customParams?: {
    emphasizeEmotionalIntelligence?: boolean;
    emphasizePrecision?: boolean;
    emphasizeConciseness?: boolean;
    emphasizeBalance?: boolean;
  };
}

export interface StoryAnalysis {
  wordCount: number;
  paragraphCount: number;
  avgWordsPerParagraph: number;
  targetWordRange: { min: number; max: number };
}

export function analyzeStory(story: string): StoryAnalysis {
  const wordCount = countWords(story);
  const paragraphCount = countParagraphs(story);
  const avgWordsPerParagraph = Math.round(wordCount / paragraphCount);
  
  return {
    wordCount,
    paragraphCount,
    avgWordsPerParagraph,
    targetWordRange: {
      min: Math.round(wordCount * 0.95),
      max: Math.round(wordCount * 1.05)
    }
  };
}

export function buildSystemInstruction(context: SystemInstructionContext): string {
  // Get the appropriate system instruction for this model
  const baseInstruction = getSystemInstruction(context.model);
  
  // If no reference story, return the base instruction
  if (!context.referenceStory) {
    return baseInstruction;
  }
  
  // Analyze the reference story
  const analysis = analyzeStory(context.referenceStory);
  
  // Build dynamic instruction based on story analysis
  return buildDynamicInstruction(baseInstruction, analysis);
}

function buildDynamicInstruction(
  baseInstruction: string,
  analysis: StoryAnalysis
): string {
  // Build structural constraints
  const structuralInstructions = buildStructuralInstructions(analysis);
  
  // Combine base instruction with dynamic constraints
  return `${baseInstruction}

${structuralInstructions}

Focus on maintaining natural flow, engaging storytelling, and high-quality writing while meeting these structural guidelines.
End with: <|endofstory|>`.trim();
}



function buildStructuralInstructions(analysis: StoryAnalysis): string {
  const { paragraphCount, avgWordsPerParagraph, targetWordRange } = analysis;
  
  return `Write ONE complete, engaging story in exactly *${paragraphCount}* paragraph${paragraphCount === 1 ? '' : 's'}.
Target approximately ${avgWordsPerParagraph} words per paragraph (±15% flexibility).
Aim for total word count between ${targetWordRange.min} and ${targetWordRange.max} words.`;
}

export function getOptimizedParameters(model: string): {
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
} {
  // Model-specific parameter optimization
  if (model.includes('gpt-4.5')) {
    return {
      temperature: 0.75,       // Higher for enhanced creativity
      top_p: 0.9,             // Broader sampling for emotional intelligence
      frequency_penalty: 0.05, // Minimal penalty for creative expression
      presence_penalty: 0.1,   // Moderate penalty for content diversity
    };
  }
  
  if (model.includes('gpt-4.1')) {
    return {
      temperature: 0.6,        // Lower for better instruction adherence
      top_p: 0.85,            // More focused sampling
      frequency_penalty: 0.1,  // Reduced for better narrative flow
      presence_penalty: 0.05,  // Small penalty for content diversity
    };
  }
  
  if (model.includes('gpt-4o-mini')) {
    return {
      temperature: 0.65,       // Balanced for concise generation
      top_p: 0.85,            // Focused for efficiency
      frequency_penalty: 0.2,  // Higher to encourage conciseness
      presence_penalty: 0.05,  // Small penalty for variety
    };
  }
  
  if (model.includes('claude')) {
    return {
      temperature: 0.7,        // Balanced for thoughtful generation
      top_p: 0.9,             // Standard sampling
      frequency_penalty: 0.1,  // Moderate penalty
      presence_penalty: 0.05,  // Small penalty for diversity
    };
  }
  
  // Default parameters for other models
  return {
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0.15,
    presence_penalty: 0,
  };
} 