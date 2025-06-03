import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

export async function handleHumanModelEvaluation(
  supabase: SupabaseClient,
  { prompt_id, is_correct, model_name = '' }: { prompt_id: string; is_correct: boolean; model_name?: string },
) {
  const { userId, isAuthenticated } = await handleApiAuth(supabase);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase.from('human_model_evaluations').insert({
    user_id: userId,
    prompt_id,
    model_name,
    guess_correct: is_correct,
  });

  if (error) {
    console.error('Failed to save evaluation', error);
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
    const { promptId, modelName = '', guessCorrect } = await req.json();
    return handleHumanModelEvaluation(supabase, {
      prompt_id: promptId,
      model_name: modelName,
      is_correct: guessCorrect,
    });
  } catch (err) {
    console.error('Error in human-model-evaluations API:', err);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
