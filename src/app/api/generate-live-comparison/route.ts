import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { truncateToSentence } from '../../../lib/utils';

// Initialize Supabase client with the SERVICE ROLE KEY for admin-level operations
// Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are in your .env.local and deployment environment
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);


// Define model names - you can adjust these or make them configurable
const MODEL_A_NAME = 'gpt-4o'; // Example: Use a powerful model for A
const MODEL_B_NAME = 'gpt-4o-mini'; // Example: Use a faster/cheaper model for B, or vary parameters

export async function handleGenerateLiveComparison(
  supabase: SupabaseClient,
  fetchFn: typeof fetch,
  prompt_db_id: string,
) {
  if (!prompt_db_id) {
    return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
  }

  const { data: promptData, error: promptError } = await supabase
    .from('writingprompts-pairwise-test')
    .select('id, prompt')
    .eq('id', prompt_db_id)
    .single();

  if (promptError || !promptData) {
    console.error('Error fetching prompt from DB:', promptError);
    return NextResponse.json({ error: 'Failed to fetch prompt text' }, { status: 500 });
  }

  const sourcePromptText = promptData.prompt;

  const resA = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_A_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are an assistant generating a short creative writing sample based on the user prompt.',
        },
        { role: 'user', content: sourcePromptText },
      ],
      temperature: 0.7,
      max_tokens: 256,
      stop: ['\n\n'],
    }),
  });
  const completionA = await resA.json();
  const response_A_text = completionA.choices?.[0]?.message?.content || '';
  const { text: sentenceA } = truncateToSentence(response_A_text);
  if (!sentenceA) {
    return NextResponse.json({ error: 'Generation A ended mid-sentence' }, { status: 500 });
  }

  const resB = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_B_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are an assistant generating a short creative writing sample based on the user prompt. Try to offer a different style or take than other responses.',
        },
        { role: 'user', content: sourcePromptText },
      ],
      temperature: 0.8,
      max_tokens: 256,
      stop: ['\n\n'],
    }),
  });
  const completionB = await resB.json();
  const response_B_text = completionB.choices?.[0]?.message?.content || '';
  const { text: sentenceB } = truncateToSentence(response_B_text);
  if (!sentenceB) {
    return NextResponse.json({ error: 'Generation B ended mid-sentence' }, { status: 500 });
  }

  const { data: liveGenerationData, error: insertError } = await supabase
    .from('live_generations')
    .insert({
      prompt_id: promptData.id,
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

  return NextResponse.json({
    live_generation_id: liveGenerationData.id,
    prompt_text: sourcePromptText,
    prompt_db_id: promptData.id,
    response_A: sentenceA,
    response_B: sentenceB,
    model_A_name: MODEL_A_NAME,
    model_B_name: MODEL_B_NAME,
  });
}

export async function POST(req: Request) {
  try {
    const { prompt_db_id } = await req.json();
    return handleGenerateLiveComparison(supabaseAdmin, fetch, prompt_db_id);
  } catch (err) {
    console.error('Overall error in /api/generate-live-comparison:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to generate live comparison', details: errorMessage },
      { status: 500 },
    );
  }
}
