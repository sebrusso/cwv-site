import { NextResponse } from 'next/server';
import { isValidLength } from '../../../lib/utils';
import { buildUnifiedChatRequest, buildBalancedChatRequest } from '../../../lib/ai/unifiedRequestBuilder';
import { generateText } from '../../../lib/models/aiService';
import { getSystemInstruction } from '../../../lib/systemInstructions';
import { countWords, countParagraphs } from '../../../lib/text-utils.js';

async function handleGenerateOpenAI(
  fetchFn: typeof fetch,
  { prompt, model, params, referenceStory }: { 
    prompt: string; 
    model: string; 
    params?: { temperature?: number; max_tokens?: number; stop?: string[] };
    referenceStory?: string;
  },
) {
  if (!isValidLength(prompt, 1, 500)) {
    return NextResponse.json(
      { error: 'Prompt must be between 1 and 500 characters' },
      { status: 400 },
    );
  }

  try {
    let text: string;
    let refWords: number | undefined;
    let refParas: number | undefined;
    let genTokens: number | undefined;

    if (referenceStory) {
      // Use unified request builder for reference story-based generation
      const balancedRequest = buildUnifiedChatRequest({
        prompt,
        model,
        referenceStory,
        customParams: params
      });
      
      // Calculate reference story stats for logging
      refWords = countWords(referenceStory);
      refParas = countParagraphs(referenceStory);
      genTokens = balancedRequest.max_tokens;

      // Make direct OpenAI API call with balanced parameters
      const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify(balancedRequest),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      const choice = data.choices?.[0] || {};
      text = choice.message?.content || '';
      
      // Remove the end token if present
      text = text.replace(/<\|endofstory\|>/g, '').trim();
    } else {
      // Use existing generateText service for backward compatibility
      text = await generateText(fetchFn, {
        prompt,
        model,
        systemMessage: getSystemInstruction(model),
        params,
      });
    }

    // Log generation statistics to console for debugging
    if (referenceStory) {
      console.log('StoryLength-Balancer stats:', {
        refWords,
        refParas,
        genTokens,
        genWords: countWords(text),
        genParas: countParagraphs(text)
      });
    }

    return NextResponse.json({ text, refWords, refParas, genTokens });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, model, params, referenceStory } = await req.json();
    return handleGenerateOpenAI(fetch, { prompt, model, params, referenceStory });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
