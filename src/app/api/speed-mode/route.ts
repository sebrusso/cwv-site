import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

export interface SpeedScorePayload {
  correct: number;
  total: number;
  durationSeconds: number;
  longestStreak: number;
}

async function handlePostSpeedScore(
  supabase: SupabaseClient,
  payload: SpeedScorePayload,
) {
  const { userId, isAuthenticated } = await handleApiAuth(supabase);
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // userId is now either a real user ID or an anonymous session ID
  const { correct, total, durationSeconds, longestStreak } = payload;
  const { error } = await supabase.from('speed_mode_scores').insert({
    user_id: userId,
    correct,
    total,
    duration_seconds: durationSeconds,
    longest_streak: longestStreak,
  });
  if (error) {
    console.error('Failed to save speed mode score', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export interface AggregatedSpeedEntry {
  user_id: string;
  total_correct: number;
  attempts: number;
  accuracy: number;
  best_streak: number;
}

export async function handleSpeedModeLeaderboard(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('speed_mode_scores')
    .select('user_id,correct,total,longest_streak');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows =
    (data as {
      user_id: string;
      correct: number;
      total: number;
      longest_streak: number;
    }[]) || [];

  const stats: Record<
    string,
    { totalCorrect: number; attempts: number; bestStreak: number }
  > = {};

  for (const row of rows) {
    const { user_id, correct, total, longest_streak } = row;
    if (!stats[user_id]) {
      stats[user_id] = { totalCorrect: 0, attempts: 0, bestStreak: 0 };
    }
    stats[user_id].totalCorrect += correct;
    stats[user_id].attempts += total;
    if (longest_streak > stats[user_id].bestStreak) {
      stats[user_id].bestStreak = longest_streak;
    }
  }

  const results: AggregatedSpeedEntry[] = Object.entries(stats).map(
    ([user_id, s]) => ({
      user_id,
      total_correct: s.totalCorrect,
      attempts: s.attempts,
      accuracy: s.attempts ? s.totalCorrect / s.attempts : 0,
      best_streak: s.bestStreak,
    }),
  );

  return NextResponse.json(results);
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
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
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
    },
  );
  const payload = await req.json();
  return handlePostSpeedScore(supabase, {
    correct: payload.correct,
    total: payload.total,
    durationSeconds: payload.durationSeconds,
    longestStreak: payload.longestStreak,
  });
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
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>,
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
    },
  );
  return handleSpeedModeLeaderboard(supabase);
}
