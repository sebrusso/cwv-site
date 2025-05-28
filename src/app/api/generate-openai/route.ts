import { NextResponse } from 'next/server';
import { isValidLength } from '../../../lib/utils';
import { generateText } from '../../../lib/models/aiService';

async function handleGenerateOpenAI(
  fetchFn: typeof fetch,
  { prompt, model, params }: { prompt: string; model: string; params?: { temperature?: number; max_tokens?: number } },
) {
  if (!isValidLength(prompt, 1, 500)) {
    return NextResponse.json(
      { error: 'Prompt must be between 1 and 500 characters' },
      { status: 400 },
    );
  }
  try {
    const text = await generateText(fetchFn, { prompt, model, params });
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { prompt, model, params } = await req.json();
    return handleGenerateOpenAI(fetch, { prompt, model, params });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
