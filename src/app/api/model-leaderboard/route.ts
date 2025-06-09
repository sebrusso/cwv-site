import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

async function handleModelLeaderboard(supabase: SupabaseClient) {
  const { data: comparisonData, error: compErr } = await supabase
    .from('model_comparisons')
    .select('model_a,model_b,winner');

  if (compErr) {
    console.error('Error fetching model_comparisons:', compErr);
    return NextResponse.json({ error: compErr.message }, { status: 500 });
  }

  const { data: humanEvalData, error: humanErr } = await supabase
    .from('human_model_evaluations')
    .select('model_name,is_correct');

  if (humanErr) {
    console.error('Error fetching human_model_evaluations:', humanErr);
    return NextResponse.json({ error: humanErr.message }, { status: 500 });
  }

  const stats: Record<
    string,
    { wins: number; losses: number; humanDeceptions: number }
  > = {};

  // Process model_comparisons
  for (const row of comparisonData || []) {
    const modelA = (row as { model_a: string }).model_a;
    const modelB = (row as { model_b: string }).model_b;
    const winner = (row as { winner: string }).winner;

    if (!stats[modelA]) stats[modelA] = { wins: 0, losses: 0, humanDeceptions: 0 };
    if (!stats[modelB]) stats[modelB] = { wins: 0, losses: 0, humanDeceptions: 0 };

    if (winner === modelA) {
      stats[modelA].wins++;
      stats[modelB].losses++;
    } else if (winner === modelB) {
      stats[modelB].wins++;
      stats[modelA].losses++;
    }
  }

  // Process human_model_evaluations
  for (const row of humanEvalData || []) {
    const model = row.model_name;
    if (!stats[model]) {
      stats[model] = { wins: 0, losses: 0, humanDeceptions: 0 };
    }
    if (!row.is_correct) {
      // A human deception means the human guess was incorrect
      stats[model].humanDeceptions++;
    }
  }

  const result = Object.entries(stats).map(([model, s]) => {
    const total = s.wins + s.losses;
    return {
      model,
      winRate: total ? s.wins / total : 0,
      humanDeceptions: s.humanDeceptions,
      totalEvaluations: total,
    };
  });

  result.sort((a, b) => b.winRate - a.winRate);
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
  return handleModelLeaderboard(supabase);
}

export interface LeaderboardEntry {
  model: string;
  winRate: number;
  humanDeceptions: number;
  totalEvaluations: number;
}
