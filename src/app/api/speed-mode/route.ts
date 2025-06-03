import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

interface SpeedModePayload {
  correct: number;
  total: number;
  longestStreak: number;
  duration: number;
}

async function handleSpeedMode(
  supabase: SupabaseClient,
  payload: SpeedModePayload
) {
  const { userId, isAuthenticated } = await handleApiAuth(supabase);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { correct, total, longestStreak, duration } = payload;
  const { error } = await supabase.from('speed_mode_results').insert({
    user_id: userId,
    correct,
    total,
    longest_streak: longestStreak,
    duration_seconds: duration,
  });

  if (error) {
    console.error('Failed to save speed mode results', error);
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
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
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
    }
  );

  try {
    const payload: SpeedModePayload = await req.json();
    return handleSpeedMode(supabase, payload);
  } catch (err) {
    console.error('Error parsing speed mode payload', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
