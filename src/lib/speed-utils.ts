import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

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