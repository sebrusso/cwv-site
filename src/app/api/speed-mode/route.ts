import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';
import { handleSpeedModeLeaderboard } from '@/lib/speed-utils';

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
