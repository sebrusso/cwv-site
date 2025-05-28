import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function handleModelLeaderboard(supabase?: SupabaseClient) {
  const client =
    supabase ||
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  const { data: modelEval, error: modelErr } = await client
    .from('model_evaluations')
    .select('model_name,is_correct');
  if (modelErr) {
    return NextResponse.json({ error: modelErr.message }, { status: 500 });
  }
  const { data: humanEval, error: humanErr } = await client
    .from('human_model_evaluations')
    .select('model_name,is_correct');
  if (humanErr) {
    return NextResponse.json({ error: humanErr.message }, { status: 500 });
  }
  const stats: Record<string, { wins: number; total: number }> = {};
  for (const row of [...(modelEval || []), ...(humanEval || [])]) {
    const model = row.model_name;
    if (!stats[model]) stats[model] = { wins: 0, total: 0 };
    if (row.is_correct) stats[model].wins++;
    stats[model].total++;
  }
  const result = Object.entries(stats).map(([model, s]) => ({
    model,
    winRate: s.total ? s.wins / s.total : 0,
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
