import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';
import { handleSpeedModeLeaderboard } from '@/lib/speed-utils';

export interface SpeedScorePayload {
  correct: number;
  total: number;
  durationSeconds: number;
  longestStreak: number;
}

async function handlePostSpeedScore(
  req: Request,
  payload: SpeedScorePayload,
) {
  const { userId, isAuthenticated, supabase } = await handleApiAuth(req);
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

async function handleUserSpeedStats(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from('speed_mode_scores')
    .select('correct,longest_streak')
    .eq('user_id', userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows =
    (data as { correct: number; longest_streak: number }[]) || [];
  let bestScore = 0;
  let longestStreak = 0;
  for (const row of rows) {
    if (row.correct > bestScore) bestScore = row.correct;
    if (row.longest_streak > longestStreak)
      longestStreak = row.longest_streak;
  }
  return NextResponse.json({ bestScore, longestStreak });
}

export async function POST(req: Request) {
  const payload = await req.json();
  return handlePostSpeedScore(req, {
    correct: payload.correct,
    total: payload.total,
    durationSeconds: payload.durationSeconds,
    longestStreak: payload.longestStreak,
  });
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      },
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handleUserSpeedStats(supabase, user.id);
  }

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


