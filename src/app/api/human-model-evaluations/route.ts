import { NextResponse } from 'next/server';
import { handleApiAuth } from '@/lib/auth-utils';

async function handleHumanModelEvaluation(
  req: Request,
  { prompt_id, is_correct, model_name = '' }: { prompt_id: string; is_correct: boolean; model_name?: string },
) {
  const { userId, isAuthenticated, supabase } = await handleApiAuth(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // userId is now either a real user ID or an anonymous session ID
  const { error } = await supabase.from('human_model_evaluations').insert({
    user_id: userId,
    prompt_id,
    model_name,
    guess_correct: is_correct,
    is_correct: is_correct, // Also populate the is_correct field for compatibility
  });

  if (error) {
    console.error('Failed to save evaluation', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const { promptId, modelName = '', guessCorrect } = await req.json();
    return handleHumanModelEvaluation(req, {
      prompt_id: promptId,
      model_name: modelName,
      is_correct: guessCorrect,
    });
  } catch (err) {
    console.error('Error in human-model-evaluations API:', err);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
