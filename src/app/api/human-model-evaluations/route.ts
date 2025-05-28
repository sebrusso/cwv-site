import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function handleHumanModelEvaluation(
  supabase: SupabaseClient,
  { prompt_id, is_correct }: { prompt_id: string; is_correct: boolean },
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { error } = await supabase.from('human_model_evaluations').insert({
    user_id: session.user.id,
    prompt_id,
    is_correct,
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
            // ignore
          }
        },
      },
    }
  );

  try {
    const { promptId, guessCorrect } = await req.json();
    return handleHumanModelEvaluation(supabase, {
      prompt_id: promptId,
      is_correct: guessCorrect,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
