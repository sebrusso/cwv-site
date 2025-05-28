import { NextResponse } from 'next/server';
import { truncateToSentence, isValidLength } from '../../../lib/utils';

export async function handleGenerateOpenAI(
  fetchFn: typeof fetch,
  { prompt, model }: { prompt: string; model: string },
) {
  if (!isValidLength(prompt, 1, 500)) {
    return NextResponse.json(
      { error: 'Prompt must be between 1 and 500 characters' },
      { status: 400 },
    );
  }
  const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant generating a short creative writing sample based on the user prompt.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 256,
      stop: ['\n\n'],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: 500 });
  }
  const data = await res.json();
  const choice = data.choices?.[0] || {};
  const text = choice.message?.content || '';
  const { text: sentence } = truncateToSentence(text);
  if (!sentence) {
    return NextResponse.json(
      { error: 'Generation ended mid-sentence' },
      { status: 500 },
    );
  }
  return NextResponse.json({ text: sentence });
}

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    return handleGenerateOpenAI(fetch, { prompt, model });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
