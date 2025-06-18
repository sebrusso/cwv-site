import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

async function insertActivity(
  admin: SupabaseClient,
  userId: string | null,
  activity_type: string,
  activity_data: Record<string, unknown> | null,
) {
  const { error } = await admin.from('user_activity_log').insert({
    user_id: userId,
    activity_type,
    activity_data,
  });
  if (error) {
    console.error('Failed to log activity', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    const body = await req.json();
    const { activity_type, ...activity_data } = body ?? {};
    if (!activity_type) {
      return NextResponse.json({ error: 'Missing activity_type' }, { status: 400 });
    }
    
    const { userId, isAuthenticated } = await handleApiAuth(req);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // userId is now either a real user ID or an anonymous session ID
    return insertActivity(admin, userId, activity_type, activity_data);
  } catch (err) {
    console.error('Error in activity-log API:', err);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}
