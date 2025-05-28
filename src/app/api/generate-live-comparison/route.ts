import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { truncateToSentence } from '../../../lib/utils';

// Initialize Supabase client with the SERVICE ROLE KEY for admin-level operations
// Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are in your .env.local and deployment environment
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Helper to lazily create the OpenAI client
async function createOpenAI() {
  const mod = await import('openai');
  const OpenAI = (mod as any).default || mod;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Available models for selection
export const AVAILABLE_MODELS = [
  'gpt-4o',
  'gpt-4o-mini', 
  'gpt-4-turbo',
  'gpt-3.5-turbo'
];

export interface GenerationData {
  live_generation_id: string;
  prompt_text: string;
  prompt_db_id: string;
  response_A: string;
  response_B: string;
  model_A_name: string;
  model_B_name: string;
}

export const generationCache = new Map<string, GenerationData>();

export async function handleGenerateLiveComparison(
  supabase: SupabaseClient,
  // OpenAI type definitions are not available in this environment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  openaiClient: any,
  {
    prompt_db_id,
    prompt_text,
    prefetch,
    modelA,
    modelB,
  }: {
    prompt_db_id?: string;
    prompt_text?: string;
    prefetch?: boolean;
    modelA?: string;
    modelB?: string;
  },
) {
  if (!prompt_db_id && !prompt_text) {
    return NextResponse.json({ error: 'Prompt ID or text is required' }, { status: 400 });
  }

  // Use provided models or fall back to defaults
  const MODEL_A_NAME = modelA && AVAILABLE_MODELS.includes(modelA) ? modelA : 'gpt-4o';
  const MODEL_B_NAME = modelB && AVAILABLE_MODELS.includes(modelB) ? modelB : 'gpt-4o-mini';

  let promptId = prompt_db_id;

  let promptData;
  if (prompt_text) {
    const { data, error } = await supabase
      .from('writingprompts-pairwise-test')
      .insert({ prompt: prompt_text })
      .select('id, prompt')
      .single();

    if (error || !data) {
      console.error('Error inserting prompt into DB:', error);
      return NextResponse.json(
        { error: 'Failed to save custom prompt' },
        { status: 500 },
      );
    }
    promptData = data;
    promptId = data.id;
  } else {
    const { data, error } = await supabase
      .from('writingprompts-pairwise-test')
      .select('id, prompt')
      .eq('id', prompt_db_id!)
      .single();

    if (error || !data) {
      console.error('Error fetching prompt from DB:', error);
      return NextResponse.json({ error: 'Failed to fetch prompt text' }, { status: 500 });
    }
    promptData = data;
  }

  const cacheKey = `${promptId}-${MODEL_A_NAME}-${MODEL_B_NAME}`;

  if (!prefetch && generationCache.has(cacheKey)) {
    const cached = generationCache.get(cacheKey);
    generationCache.delete(cacheKey);
    return NextResponse.json(cached);
  }

  const sourcePromptText = promptData.prompt;
  // 2. Generate response A from OpenAI
  const completionA = await openaiClient.chat.completions.create({
    model: MODEL_A_NAME,
    messages: [
      {
        role: 'system',
        content: 'You are an assistant generating a short creative writing sample based on the user prompt.',
      },
      { role: 'user', content: sourcePromptText },
    ],
    temperature: 0.7, // You can vary parameters
    max_tokens: 300,
    stop: ['\n\n'],
  });
  const response_A_text = completionA.choices?.[0]?.message?.content || '';
  const { text: sentenceA } = truncateToSentence(response_A_text);
  if (!sentenceA) {
    return NextResponse.json({ error: 'Generation A ended mid-sentence' }, { status: 500 });
  }

  // 3. Generate response B from OpenAI (could be different model or params)
  const completionB = await openaiClient.chat.completions.create({
    model: MODEL_B_NAME,
    messages: [
      {
        role: 'system',
        content:
          'You are an assistant generating a short creative writing sample based on the user prompt. Try to offer a different style or take than other responses.',
      },
      { role: 'user', content: sourcePromptText },
    ],
    temperature: 0.8, // Slightly different temperature for variety
    max_tokens: 300,
    stop: ['\n\n'],
  });
  const response_B_text = completionB.choices?.[0]?.message?.content || '';
  const { text: sentenceB } = truncateToSentence(response_B_text);
  if (!sentenceB) {
    return NextResponse.json({ error: 'Generation B ended mid-sentence' }, { status: 500 });
  }

  // 4. Save the generated pair to the 'live_generations' table
  const { data: liveGenerationData, error: insertError } = await supabase
    .from('live_generations')
    .insert({
      prompt_id: promptData.id, // Link to the prompt used
      model_a_name: MODEL_A_NAME,
      response_a_text: sentenceA,
      model_b_name: MODEL_B_NAME,
      response_b_text: sentenceB,
    })
    .select('id')
    .single();

  if (insertError || !liveGenerationData) {
    console.error('Error saving live generation to DB:', insertError);
    return NextResponse.json({ error: 'Failed to save generated stories' }, { status: 500 });
  }

  const payload = {
    live_generation_id: liveGenerationData.id,
    prompt_text: sourcePromptText,
    prompt_db_id: promptData.id,
    response_A: sentenceA,
    response_B: sentenceB,
    model_A_name: MODEL_A_NAME,
    model_B_name: MODEL_B_NAME,
  };

  if (prefetch) {
    generationCache.set(cacheKey, payload);
    return NextResponse.json({ prefetched: true });
  }

  return NextResponse.json(payload);
}

export async function GET() {
  return NextResponse.json({ availableModels: AVAILABLE_MODELS });
}

export async function POST(req: Request) {
  try {
    const { prompt_db_id, prompt_text, prefetch, modelA, modelB } = await req.json();
    const openai = await createOpenAI();
    return handleGenerateLiveComparison(supabaseAdmin, openai, { prompt_db_id, prompt_text, prefetch, modelA, modelB });
  } catch (err) {
    console.error('Overall error in /api/generate-live-comparison:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to generate live comparison', details: errorMessage },
      { status: 500 },
    );
  }
}
