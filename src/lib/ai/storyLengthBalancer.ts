import { countWords, countParagraphs } from "../text-utils.js";

export interface BalancedChatRequest {
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

export function buildBalancedChatRequest(
  prompt: string,
  referenceStory: string,
  model: string = "gpt-4o"
): BalancedChatRequest {
  const refWords       = countWords(referenceStory);
  const refParas       = countParagraphs(referenceStory);
  const avgParaWords   = Math.round(refWords / refParas);
  const lo             = Math.round(refWords * 0.95);
  const hi             = Math.round(refWords * 1.05);
  const maxTokens      = Math.ceil(refWords * 1.35) + 50; // buffer

  // Optimize parameters for GPT-4.1's enhanced instruction following
  const isGPT41 = model === 'gpt-4.1';
  const optimizedParams = isGPT41 ? {
    temperature: 0.6,        // Lower temperature for better instruction adherence
    top_p: 0.85,            // Slightly more focused sampling
    frequency_penalty: 0.1,  // Reduced to allow for better narrative flow
    presence_penalty: 0.05,  // Small penalty for better content diversity
  } : {
    temperature: 0.7,
    top_p: 0.9,
    frequency_penalty: 0.15,
    presence_penalty: 0,
  };

  const systemMsg = isGPT41 ? `
You are an exceptional award-winning short-story author with precise narrative control.
Write ONE complete, engaging story in exactly *${refParas}* paragraphs.
Target approximately ${avgParaWords} words per paragraph (±10% flexibility).
Aim for total word count between ${lo} and ${hi} words.
Focus on rich storytelling while maintaining these structural constraints naturally.
End with: <|endofstory|>
  `.trim() : `
You are an award-winning short-story author.
Write ONE complete story in *${refParas}* paragraphs.
Each paragraph ≈ ${avgParaWords} words (±15).
Total length between ${lo} and ${hi} words.
Maintain natural flow; do NOT mention these constraints.
End with the token: <|endofstory|>.
  `.trim();

  return {
    model: model,
    messages: [
      { role: "system", content: systemMsg },
      { role: "user",   content: prompt  }
    ],
    max_tokens:        maxTokens,
    ...optimizedParams,
    stop:              ["<|endofstory|>"]
  };
} 