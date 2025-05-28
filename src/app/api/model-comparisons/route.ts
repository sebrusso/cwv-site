import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ComparisonPayload {
  modelA: string;
  modelB: string;
  winner: string;
  promptId: string;
}

export async function handleModelComparison(
  supabase: SupabaseClient,
  payload: ComparisonPayload
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { modelA, modelB, winner, promptId } = payload;
  if (!modelA || !modelB || !winner || !promptId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (winner !== modelA && winner !== modelB) {
    return NextResponse.json({ error: 'Winner must be one of the compared models' }, { status: 400 });
  }

  const { error } = await supabase.from('model_comparisons').insert({
    user_id: session.user.id,
    model_a: modelA,
    model_b: modelB,
    winner,
    prompt_id: promptId,
  });

  if (error) {
    console.error('Failed to save model comparison', error);
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
    const payload = await req.json();
    return handleModelComparison(supabase, payload);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
