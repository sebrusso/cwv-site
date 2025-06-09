import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

interface MetricPayload {
  evaluationTime: number;
  promptSimilarity: number;
  confidenceScore: number;
}

async function getClient() {
  const cookieStorePromise = cookies();
  return createServerClient(
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
            // ignore cookie errors
          }
        },
      },
    }
  );
}

async function handleEvaluationQuality(
  supabase: SupabaseClient,
  payload: {
    evaluationTime: number;
    promptSimilarity: number;
    confidenceScore: number;
  },
) {
  const { userId, isAuthenticated } = await handleApiAuth(supabase);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // userId is now either a real user ID or an anonymous session ID
  const { error } = await supabase.from('evaluation_quality_metrics').insert({
    user_id: userId,
    evaluation_time: payload.evaluationTime,
    prompt_similarity: payload.promptSimilarity,
    confidence_score: payload.confidenceScore,
  });

  if (error) {
    console.error('Failed to save evaluation quality metrics', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

async function handleGetQuality(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('evaluation_quality_metrics')
    .select('evaluation_time,prompt_similarity,confidence_score');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ evaluationTime: 0, promptSimilarity: 0, confidenceScore: 0 });
  }
  const total = data.length;
  const sums = data.reduce(
    (acc, row) => {
      acc.evaluationTime += row.evaluation_time || 0;
      acc.promptSimilarity += row.prompt_similarity || 0;
      acc.confidenceScore += row.confidence_score || 0;
      return acc;
    },
    { evaluationTime: 0, promptSimilarity: 0, confidenceScore: 0 }
  );
  return NextResponse.json({
    evaluationTime: sums.evaluationTime / total,
    promptSimilarity: sums.promptSimilarity / total,
    confidenceScore: sums.confidenceScore / total,
  });
}

export async function POST(req: Request) {
  const supabase = await getClient();
  const payload = (await req.json()) as MetricPayload;
  return handleEvaluationQuality(supabase, payload);
}

export async function GET() {
  const supabase = await getClient();
  return handleGetQuality(supabase);
}
