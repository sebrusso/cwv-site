import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ComparisonRow {
  model_a_name: string;
  model_b_name: string;
  winner: string;
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

export async function handleModelQualityLeaderboard(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('model_comparisons')
    .select('model_a_name,model_b_name,winner');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats: Record<string, { wins: number; losses: number }> = {};
  const matrix: Record<string, Record<string, number>> = {};

  for (const row of data as ComparisonRow[]) {
    const a = row.model_a_name;
    const b = row.model_b_name;
    const winner =
      row.winner === 'A' ? a : row.winner === 'B' ? b : row.winner;

    if (!stats[a]) stats[a] = { wins: 0, losses: 0 };
    if (!stats[b]) stats[b] = { wins: 0, losses: 0 };

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
