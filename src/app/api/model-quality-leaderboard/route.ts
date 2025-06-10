import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ModelComparison {
  model_a_name: string;
  model_b_name: string;
  winner: string;
}

interface ModelEvaluation {
  model_name: string;
  is_correct: boolean;
}

interface HumanModelEvaluation {
  model_name: string;
  is_correct: boolean;
}

interface ModelStats {
  wins: number;
  losses: number;
  humanCorrect: number;
  humanTotal: number;
  humanDeceptions: number;
}

export interface QualityLeaderboardEntry {
  model: string;
  wins: number;
  losses: number;
}

export interface QualityLeaderboardResult {
  leaderboard: QualityLeaderboardEntry[];
  matrix: Record<string, Record<string, number>>;
}

function recordWin(matrix: Record<string, Record<string, number>>, winner: string, loser: string) {
  if (!matrix[winner]) matrix[winner] = {};
  if (!matrix[winner][loser]) matrix[winner][loser] = 0;
  matrix[winner][loser]++;
}

async function handleModelQualityLeaderboard(supabase: SupabaseClient) {
  // Fetch model_comparisons
  const { data: comparisons, error: compError } = await supabase
    .from('model_comparisons')
    .select('model_a_name,model_b_name,winner');

  if (compError) {
    return NextResponse.json({ error: compError.message }, { status: 500 });
  }

  // Fetch model_evaluations
  const { data: evaluations, error: evalError } = await supabase
    .from('model_evaluations')
    .select('model_name,is_correct');

  if (evalError) {
    return NextResponse.json({ error: evalError.message }, { status: 500 });
  }

  // Fetch human_model_evaluations
  const { data: humanEvals, error: humanError } = await supabase
    .from('human_model_evaluations')
    .select('model_name,is_correct');

  if (humanError) {
    return NextResponse.json({ error: humanError.message }, { status: 500 });
  }

  const stats: Record<string, ModelStats> = {};
  const matrix: Record<string, Record<string, number>> = {};

  // Process model_comparisons
  for (const row of (comparisons as ModelComparison[]) || []) {
    const a = row.model_a_name;
    const b = row.model_b_name;
    const winner = row.winner;

    if (!stats[a]) stats[a] = { wins: 0, losses: 0, humanCorrect: 0, humanTotal: 0, humanDeceptions: 0 };
    if (!stats[b]) stats[b] = { wins: 0, losses: 0, humanCorrect: 0, humanTotal: 0, humanDeceptions: 0 };

    if (winner === a) {
      stats[a].wins++;
      stats[b].losses++;
      recordWin(matrix, a, b);
    } else if (winner === b) {
      stats[b].wins++;
      stats[a].losses++;
      recordWin(matrix, b, a);
    }
  }

  // Process model_evaluations
  for (const row of (evaluations as ModelEvaluation[]) || []) {
    const model = row.model_name;
    if (!stats[model]) {
      stats[model] = { wins: 0, losses: 0, humanCorrect: 0, humanTotal: 0, humanDeceptions: 0 };
    }
    if (row.is_correct) {
      stats[model].humanCorrect++;
    }
    stats[model].humanTotal++;
  }

  // Process human_model_evaluations
  for (const row of (humanEvals as HumanModelEvaluation[]) || []) {
    const model = row.model_name;
    if (!stats[model]) {
      stats[model] = { wins: 0, losses: 0, humanCorrect: 0, humanTotal: 0, humanDeceptions: 0 };
    }
    if (!row.is_correct) {
      // A human deception means the human guess was incorrect
      stats[model].humanDeceptions++;
    }
  }

  const leaderboard = Object.entries(stats)
    .map(([model, { wins, losses }]) => ({ model, wins, losses }))
    .sort((a, b) => b.wins / (b.wins + b.losses) - a.wins / (a.wins + a.losses));

  const result: QualityLeaderboardResult = { leaderboard, matrix };
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

  return handleModelQualityLeaderboard(supabase);
}
