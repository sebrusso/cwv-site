import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

interface CacheEntry {
  data: LeaderboardResult[];
  expires: number;
}

export interface LeaderboardResult {
  model: string;
  winRate: number;
}

export const leaderboardCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minute


export async function handleModelLeaderboard(
  supabase: SupabaseClient,
  page = 1,
  pageSize = 50,
) {
  const key = `${page}-${pageSize}`;
  const cached = leaderboardCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data);
  }

  const { data: modelEval, error: modelErr } = await supabase
    .from('model_evaluations')
    .select('model_name,is_correct');
  if (modelErr) {
    return NextResponse.json({ error: modelErr.message }, { status: 500 });
  }
  const { data: humanEval, error: humanErr } = await supabase
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

  const start = (page - 1) * pageSize;
  const paginated = result.slice(start, start + pageSize);

  leaderboardCache.set(key, {
    data: paginated,
    expires: Date.now() + CACHE_TTL_MS,
  });

  return NextResponse.json(paginated);
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
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  return handleModelLeaderboard(supabase, page, pageSize);
}

export interface LeaderboardEntry {
  model: string;
  mode: string;
  wins: number;
  losses: number;
}
