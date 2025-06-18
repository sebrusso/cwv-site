import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

async function handleLogEvent(
  req: Request,
  { eventType, eventData }: { eventType: string; eventData?: unknown }
) {
  let userId: string | null = null;
  const cookieStore = await cookies();

  // First, try to get user from bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
    }
  }

  // If no user from token, try to get anonymous session from cookies
  if (!userId) {
    userId = cookieStore.get('anonymous_session_id')?.value || null;
  }
  
  // If still no userId, generate an anonymous session ID
  if (!userId) {
    userId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    cookieStore.set('anonymous_session_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 // 1 year
    });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { error } = await admin.from('user_activity_log').insert({
    user_id: userId,
    activity_type: eventType,
    activity_data: eventData ?? null,
  });
  if (error) {
    console.error('Failed to log event - detailed error:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return handleLogEvent(req, {
      eventType: body.eventType,
      eventData: body.eventData,
    });
  } catch (err) {
    console.error('Error in log-event API:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}
