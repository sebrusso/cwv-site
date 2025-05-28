import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface HumanEvalRow {
  model_name: string;
  guess_correct: boolean;
  created_at: string;
}

export async function handleHumanDeceptionLeaderboard(
  supabase: SupabaseClient,
  start?: string,
  end?: string
) {
  let query = supabase
    .from('human_model_evaluations')
    .select('model_name,guess_correct,created_at');
  if (start) {
    query = query.gte('created_at', start);
  }
  if (end) {
    query = query.lte('created_at', end);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const stats: Record<string, { total: number; successes: number }> = {};
  for (const row of data as HumanEvalRow[]) {
    if (!stats[row.model_name]) {
      stats[row.model_name] = { total: 0, successes: 0 };
    }
    stats[row.model_name].total++;
    if (!row.guess_correct) {
      stats[row.model_name].successes++;
    }
  }

  const result = Object.entries(stats).map(([model, s]) => ({
    model,
    total: s.total,
    successRate: s.total ? s.successes / s.total : 0,
  }));
  result.sort((a, b) => b.successRate - a.successRate);
  return NextResponse.json(result);
}

export async function GET(req: Request) {
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
  const { searchParams } = new URL(req.url);
  const start = searchParams.get('start') ?? undefined;
  const end = searchParams.get('end') ?? undefined;
  return handleHumanDeceptionLeaderboard(supabase, start, end);
}
