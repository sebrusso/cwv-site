import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
        max_tokens: 300,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: 500 });
    }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ text });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to generate text' },
      { status: 500 },
    );
  }
}
