import { NextResponse } from 'next/server';
import { handleApiAuth } from '@/lib/auth-utils';

export interface ComparisonPayload {
  modelA: string;
  modelB: string;
  winner: string;
  promptId: string;
}

async function handleModelComparison(
  req: Request,
  payload: ComparisonPayload
) {
  const { userId, isAuthenticated, supabase } = await handleApiAuth(req);
  
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { modelA, modelB, winner, promptId } = payload;
  if (!modelA || !modelB || !winner || !promptId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (winner !== modelA && winner !== modelB) {
    return NextResponse.json({ error: 'Winner must be one of the compared models' }, { status: 400 });
  }

  // userId is now either a real user ID or an anonymous session ID
  const { error } = await supabase.from('model_comparisons').insert({
    user_id: userId,
    model_a_name: modelA,
    model_b_name: modelB,
    winner,
    prompt_id: promptId,
  });

  if (error) {
    console.error('Failed to save model comparison', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    return handleModelComparison(req, payload);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
