import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await supabaseAdmin.from('error_logs').insert({
      user_id: body.user_id ?? null,
      source: body.source ?? 'client',
      message: body.message,
      stack: body.stack,
      context: body.context ?? null,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to log error', err);
    return NextResponse.json({ error: 'Failed to log error' }, { status: 500 });
  }
}
