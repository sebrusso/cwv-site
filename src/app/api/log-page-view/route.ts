import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const { path, user_id } = await req.json();
    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    await supabaseAdmin.from('page_views').insert({
      user_id: user_id ?? null,
      path,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to log page view', err);
    return NextResponse.json({ error: 'Failed to log page view' }, { status: 500 });
  }
}
