import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

async function handleLogEvent(
  supabase: SupabaseClient,
  admin: SupabaseClient,
  { eventType, eventData }: { eventType: string; eventData?: unknown }
) {
  const { userId, isAuthenticated } = await handleApiAuth(supabase);
  
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // userId is now either a real user ID or an anonymous session ID
  console.log('Attempting to insert event:', { user_id: userId, activity_type: eventType, activity_data: eventData });
  
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
    const cookieStorePromise = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => (await cookieStorePromise).getAll(),
          setAll: async (
            cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
          ) => {
            try {
              const store = await cookieStorePromise;
              cookiesToSet.forEach(({ name, value, options }) => {
                store.set(name, value, options as CookieOptions);
              });
            } catch {
              // ignore cookie errors
            }
          },
        },
      }
    );

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
    );

    const body = await req.json();
    return handleLogEvent(supabase, admin, {
      eventType: body.eventType,
      eventData: body.eventData,
    });
  } catch (err) {
    console.error('Error in log-event API:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}
