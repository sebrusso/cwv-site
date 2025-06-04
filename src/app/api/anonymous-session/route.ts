import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const { sessionId, convertedToUserId } = await req.json();
    if (!sessionId || !convertedToUserId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('anonymous_sessions')
      .update({ converted_to_user_id: convertedToUserId })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to update anonymous session', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating anonymous session', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
