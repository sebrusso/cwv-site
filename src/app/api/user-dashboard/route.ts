import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

interface RawEvalRow {
  user_id: string;
  is_correct: boolean;
  created_at: string;
}

interface DailyStats {
  date: string;
  correct: number;
  total: number;
}

interface DashboardData {
  daily: DailyStats[];
  total: { correct: number; total: number };
  ranking: { position: number; totalUsers: number };
}

async function computeDashboardData(
  supabase: SupabaseClient,
  userId: string
): Promise<DashboardData> {
  const { data: hmData } = await supabase
    .from('human_model_evaluations')
    .select('user_id,is_correct,created_at');
  const { data: modelData } = await supabase
    .from('model_evaluations')
    .select('user_id,is_correct,created_at');

  const rows: RawEvalRow[] = [
    ...(hmData || []),
    ...(modelData || []),
  ];

  const userRows = rows.filter((r) => r.user_id === userId);
  const dailyMap: Record<string, { correct: number; total: number }> = {};
  for (const r of userRows) {
    const date = r.created_at.split('T')[0];
    if (!dailyMap[date]) dailyMap[date] = { correct: 0, total: 0 };
    if (r.is_correct) dailyMap[date].correct++;
    dailyMap[date].total++;
  }
  const daily = Object.entries(dailyMap)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const total = daily.reduce(
    (acc, d) => {
      acc.correct += d.correct;
      acc.total += d.total;
      return acc;
    },
    { correct: 0, total: 0 }
  );

  const userAccuracy: Record<string, { correct: number; total: number }> = {};
  for (const r of rows) {
    if (!userAccuracy[r.user_id]) userAccuracy[r.user_id] = { correct: 0, total: 0 };
    if (r.is_correct) userAccuracy[r.user_id].correct++;
    userAccuracy[r.user_id].total++;
  }
  const rankingArray = Object.entries(userAccuracy)
    .map(([uid, stats]) => ({ uid, acc: stats.correct / (stats.total || 1) }))
    .sort((a, b) => b.acc - a.acc);
  const position = rankingArray.findIndex((r) => r.uid === userId) + 1;
  const totalUsers = rankingArray.length;

  return { daily, total, ranking: { position, totalUsers } };
}

async function handleUserDashboard(
  supabase: SupabaseClient,
  userId: string
) {
  const data = await computeDashboardData(supabase, userId);
  return NextResponse.json(data);
}

export async function GET(request: Request) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return handleUserDashboard(supabase, user.id);
}
