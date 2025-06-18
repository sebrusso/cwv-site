import { NextResponse } from 'next/server';
import { handleApiAuth } from '@/lib/auth-utils';

async function handleExperienceFeedback(
  req: Request,
  payload: { rating: number; feedback_text?: string; category?: string }
) {
  const { userId, isAuthenticated, supabase } = await handleApiAuth(req);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rating, feedback_text, category } = payload;

  const { error } = await supabase.from('user_experience_feedback').insert({
    user_id: userId,
    rating,
    feedback_text,
    category,
  });

  if (error) {
    console.error('Failed to save experience feedback', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const payload = await req.json();
  return handleExperienceFeedback(req, payload);
}
