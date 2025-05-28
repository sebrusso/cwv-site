import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function handleHumanModelEvaluation(
  supabase: SupabaseClient,
  body: { promptId: string; modelName: string; guessCorrect: boolean }
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { promptId, modelName, guessCorrect } = body;
  const { error } = await supabase.from('human_model_evaluations').insert({
    user_id: session.user.id,
    prompt_id: promptId,
    model_name: modelName,
    guess_correct: guessCorrect,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const cookieStorePromise = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () => (await cookieStorePromise).getAll(),
        setAll: async (
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
        ) => {
          try {
            const store = await cookieStorePromise;
            cookiesToSet.forEach(({ name, value, options }) => {
              store.set(name, value, options as CookieOptions);
            });
          } catch {
            // ignore cookie setting errors
          }
        },
      },
    }
  );

  try {
    const body = await req.json();
    return handleHumanModelEvaluation(supabase, body);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
