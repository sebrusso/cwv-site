import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { truncateToSentence } from '../../../lib/utils';
// Note: buildUnifiedChatRequest available for future use
import { buildSystemInstruction } from '../../../lib/ai/systemInstructionBuilder';
import { generateText, type GenerateOptions } from '../../../lib/models/aiService';
import { AVAILABLE_MODELS } from '../../../lib/models/modelConfig';

// Initialize Supabase client with the SERVICE ROLE KEY for admin-level operations
// Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are in your .env.local and deployment environment
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Models are defined in modelConfig.ts and re-exported here for convenience

interface GenerationData {
  live_generation_id: string;
  prompt_text: string;
  prompt_db_id: string;
  response_A: string;
  response_B: string;
  model_A_name: string;
  model_B_name: string;
}

const generationCache = new Map<string, GenerationData>();

async function handleGenerateLiveComparison(
  supabase: SupabaseClient,
  { 
    prompt_db_id,
    prompt_text,
    prefetch,
    modelA,
    modelB,
    paramsA,
    paramsB,
  }: {
    prompt_db_id?: string;
    prompt_text?: string;
    prefetch?: boolean;
    modelA?: string;
    modelB?: string;
    paramsA?: GenerateOptions;
    paramsB?: GenerateOptions;
  },
) {
  if (!prompt_db_id && !prompt_text) {
    return NextResponse.json({ error: 'Prompt ID or text is required' }, { status: 400 });
  }

  // Use provided models or fall back to defaults
  const MODEL_A_NAME = modelA && AVAILABLE_MODELS.includes(modelA) ? modelA : 'gpt-4o';
  const MODEL_B_NAME = modelB && AVAILABLE_MODELS.includes(modelB) ? modelB : 'gpt-4o-mini';

  const defaultParamsA: GenerateOptions = {
    temperature: 0.7,
    max_tokens: 300,
    stop: ['\n\n'],
  };

  const defaultParamsB: GenerateOptions = {
    temperature: 0.8,
    max_tokens: 300,
    stop: ['\n\n'],
  };

  const finalParamsA = { ...defaultParamsA, ...paramsA };
  const finalParamsB = { ...defaultParamsB, ...paramsB };

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
  const response_A_text = await generateText(fetch, {
    prompt: sourcePromptText,
    model: MODEL_A_NAME,
    systemMessage: buildSystemInstruction({ model: MODEL_A_NAME }),
    params: finalParamsA,
  });
  const { text: sentenceA } = truncateToSentence(response_A_text);
  if (!sentenceA) {
    return NextResponse.json({ error: 'Generation A ended mid-sentence' }, { status: 500 });
  }

  // 3. Generate response B from OpenAI (could be different model or params)
  const response_B_text = await generateText(fetch, {
    prompt: sourcePromptText,
    model: MODEL_B_NAME,
    systemMessage: buildSystemInstruction({ model: MODEL_B_NAME }),
    params: finalParamsB,
  });
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
      generation_parameters_a: finalParamsA,
      generation_parameters_b: finalParamsB,
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
    // Combine destructuring to include prompt_text from HEAD and other params from main
    const {
      prompt_db_id,
      prompt_text,
      prefetch,
      modelA,
      modelB,
      paramsA,
      paramsB,
    } = await req.json();
    // Call handleGenerateLiveComparison, ensuring prompt_text is passed if available
    // The openai client is no longer passed directly, as aiService handles it.
    return handleGenerateLiveComparison(supabaseAdmin, {
      prompt_db_id,
      prompt_text,
      prefetch,
      modelA,
      modelB,
      paramsA,
      paramsB,
    });
  } catch (err) {
    console.error('Overall error in /api/generate-live-comparison:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to generate live comparison', details: errorMessage },
      { status: 500 },
    );
  }
}
