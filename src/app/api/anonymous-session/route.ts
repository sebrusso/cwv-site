import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export async function handleAnonymousSession(
  client: SupabaseClient,
  payload: { sessionId: string; increment?: boolean; convertedToUserId?: string },
) {
  const { sessionId, increment, convertedToUserId } = payload;
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  // Handle user conversion
  if (convertedToUserId) {
    const { error } = await client
      .from('anonymous_sessions')
      .update({ converted_to_user_id: convertedToUserId })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to update anonymous session', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Handle evaluation count increment
  const { data, error } = await client
    .from('anonymous_sessions')
    .select('evaluations_count')
    .eq('session_id', sessionId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Failed to fetch anonymous session', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let count = data?.evaluations_count ?? 0;
  if (increment) count += 1;

  const { error: upsertError } = await client
    .from('anonymous_sessions')
    .upsert({ session_id: sessionId, evaluations_count: count }, { onConflict: 'session_id' });

  if (upsertError) {
    console.error('Failed to upsert anonymous session', upsertError);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, evaluationsCount: count });
}

export async function POST(req: Request) {
  const body = await req.json();
  return handleAnonymousSession(supabase, body);
}
