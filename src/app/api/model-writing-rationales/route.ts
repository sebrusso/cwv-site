import { NextResponse } from 'next/server';
import { handleApiAuth } from '@/lib/auth-utils';

export interface ModelRationalePayload {
  evaluation_id: string;
  rationale: string;
  prompt_id: string;
  model_name: string;
  selected_response: string;
  ground_truth: string;
  is_correct: boolean;
}

async function handleModelRationale(
  req: Request,
  payload: ModelRationalePayload
) {
  const { userId, isAuthenticated, supabase } = await handleApiAuth(req);
  
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { evaluation_id, rationale, prompt_id, model_name, selected_response, ground_truth, is_correct } = payload;
  if (!evaluation_id || !rationale || !prompt_id || !model_name || !selected_response || !ground_truth || typeof is_correct !== 'boolean') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // userId is now either a real user ID or an anonymous session ID
  const { error } = await supabase.from('model_writing_rationales').insert({
    evaluation_id,
    rationale,
    user_id: userId,
    prompt_id,
    model_name,
    selected_response,
    ground_truth,
    is_correct,
  });

  if (error) {
    console.error('Failed to save model rationale', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    return handleModelRationale(req, payload);
  } catch (err) {
    console.error('Error in model-writing-rationales API:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 