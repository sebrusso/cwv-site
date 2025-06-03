import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ModelComparisonRow {
  model_a: string;
  model_b: string;
  winner: string;
}

export async function handleModelLeaderboard(supabase: SupabaseClient) {
  const { data: comparisonData, error: cmpErr } = await supabase
    .from('model_comparisons')
    .select('model_a,model_b,winner');

  if (cmpErr) {
    console.error('Error fetching model_comparisons:', cmpErr);
    return NextResponse.json({ error: cmpErr.message }, { status: 500 });
  }

  const { data: humanEvalData, error: humanErr } = await supabase
    .from('human_model_evaluations')
    .select('model_name,is_correct');

  if (humanErr) {
    console.error('Error fetching human_model_evaluations:', humanErr);
    return NextResponse.json({ error: humanErr.message }, { status: 500 });
  }

  const stats: Record<string, { wins: number; losses: number; humanDeceptions: number }> = {};

  // Process model_comparisons
  for (const row of (comparisonData || []) as ModelComparisonRow[]) {
    const { model_a: a, model_b: b, winner } = row;

    if (!stats[a]) stats[a] = { wins: 0, losses: 0, humanDeceptions: 0 };
    if (!stats[b]) stats[b] = { wins: 0, losses: 0, humanDeceptions: 0 };

    if (winner === a) {
      stats[a].wins++;
      stats[b].losses++;
    } else if (winner === b) {
      stats[b].wins++;
      stats[a].losses++;
    }
  }

  // Process human_model_evaluations
  for (const row of humanEvalData || []) {
    const model = row.model_name;
    if (!stats[model]) {
      // Initialize if model has human evals but no comparisons yet
      stats[model] = { wins: 0, losses: 0, humanDeceptions: 0 };
    }
    if (!row.is_correct) { // A human deception means the human guess was incorrect
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
  mode: string;
  wins: number;
  losses: number;
}
