import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with the SERVICE ROLE KEY for admin-level operations
// Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are in your .env.local and deployment environment
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is in your .env.local and deployment environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define model names - you can adjust these or make them configurable
const MODEL_A_NAME = 'gpt-4o'; // Example: Use a powerful model for A
const MODEL_B_NAME = 'gpt-4o-mini'; // Example: Use a faster/cheaper model for B, or vary parameters

export async function POST(req: Request) {
  try {
    const { prompt_db_id } = await req.json(); // Expecting id from the 'writingprompts-pairwise-test' table

    if (!prompt_db_id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }

    // 1. Fetch the prompt text from the 'writingprompts-pairwise-test' table
    const { data: promptData, error: promptError } = await supabaseAdmin
      .from('writingprompts-pairwise-test')
      .select('id, prompt')
      .eq('id', prompt_db_id)
      .single();

    if (promptError || !promptData) {
      console.error('Error fetching prompt from DB:', promptError);
      return NextResponse.json({ error: 'Failed to fetch prompt text' }, { status: 500 });
    }

    const sourcePromptText = promptData.prompt;

    // 2. Generate response A from OpenAI
    const completionA = await openai.chat.completions.create({
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
    });
    const response_A_text = completionA.choices?.[0]?.message?.content || '';

    // 3. Generate response B from OpenAI (could be different model or params)
    const completionB = await openai.chat.completions.create({
      model: MODEL_B_NAME,
      messages: [
        {
          role: 'system',
          content: 'You are an assistant generating a short creative writing sample based on the user prompt. Try to offer a different style or take than other responses.',
        },
        { role: 'user', content: sourcePromptText },
      ],
      temperature: 0.8, // Slightly different temperature for variety
      max_tokens: 300,
    });
    const response_B_text = completionB.choices?.[0]?.message?.content || '';

    if (!response_A_text || !response_B_text) {
        return NextResponse.json({ error: 'Failed to generate one or both AI responses' }, { status: 500 });
    }

    // 4. Save the generated pair to the 'live_generations' table
    const { data: liveGenerationData, error: insertError } = await supabaseAdmin
      .from('live_generations')
      .insert({
        prompt_id: promptData.id, // Link to the original prompt_db_id
        model_a_name: MODEL_A_NAME,
        response_a_text: response_A_text,
        model_b_name: MODEL_B_NAME,
        response_b_text: response_B_text,
        // generation_parameters_a: { temperature: 0.7, max_tokens: 300 }, // Optional
        // generation_parameters_b: { temperature: 0.8, max_tokens: 300 }, // Optional
      })
      .select('id') // Select the ID of the newly inserted row
      .single();

    if (insertError || !liveGenerationData) {
      console.error('Error saving live generation to DB:', insertError);
      return NextResponse.json({ error: 'Failed to save generated stories' }, { status: 500 });
    }

    // 5. Return the necessary data to the client
    return NextResponse.json({
      live_generation_id: liveGenerationData.id,
      prompt_text: sourcePromptText, // Send original prompt text back
      prompt_db_id: promptData.id,   // Send original prompt_db_id back
      response_A: response_A_text,
      response_B: response_B_text,
      model_A_name: MODEL_A_NAME,
      model_B_name: MODEL_B_NAME,
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