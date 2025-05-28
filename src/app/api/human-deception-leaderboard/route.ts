import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface HumanEvalRow {
  model_name: string;
  guess_correct: boolean;
}

export async function handleHumanLeaderboard(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('human_model_evaluations')
    .select('model_name,guess_correct');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const stats: Record<string, { fooled: number; total: number }> = {};
  for (const row of (data as HumanEvalRow[]) || []) {
    if (!stats[row.model_name]) stats[row.model_name] = { fooled: 0, total: 0 };
    if (!row.guess_correct) stats[row.model_name].fooled++;
    stats[row.model_name].total++;
  }
  const result = Object.entries(stats).map(([model, s]) => ({
    model,
    deceptionRate: s.total ? s.fooled / s.total : 0,
    total: s.total,
  }));
  result.sort((a, b) => b.deceptionRate - a.deceptionRate);
  return NextResponse.json(result);
}

export async function GET() {
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
  return handleHumanLeaderboard(supabase);
}
