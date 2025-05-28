import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

async function handleModelLeaderboard(supabase: SupabaseClient) {
  const { data: modelEvalData, error: modelErr } = await supabase
    .from('model_evaluations')
    .select('model_name,is_correct');

  if (modelErr) {
    console.error('Error fetching model_evaluations:', modelErr);
    return NextResponse.json({ error: modelErr.message }, { status: 500 });
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
    { modelWins: number; totalEvaluations: number; humanDeceptions: number }
  > = {};

  // Process model_evaluations
  for (const row of modelEvalData || []) {
    const model = row.model_name;
    if (!stats[model]) {
      stats[model] = { modelWins: 0, totalEvaluations: 0, humanDeceptions: 0 };
    }
    if (row.is_correct) {
      stats[model].modelWins++;
    }
    stats[model].totalEvaluations++;
  }

  // Process human_model_evaluations
  for (const row of humanEvalData || []) {
    const model = row.model_name;
    if (!stats[model]) {
      // This case should ideally not happen if a model has human evals but no model evals
      // but we initialize it to be safe.
      stats[model] = { modelWins: 0, totalEvaluations: 0, humanDeceptions: 0 };
    }
    if (!row.is_correct) { // A human deception means the human guess was incorrect
      stats[model].humanDeceptions++;
    }
  }

  const result = Object.entries(stats).map(([model, s]) => ({
    model,
    winRate: s.totalEvaluations ? s.modelWins / s.totalEvaluations : 0,
    humanDeceptions: s.humanDeceptions,
    totalEvaluations: s.totalEvaluations,
  }));

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
