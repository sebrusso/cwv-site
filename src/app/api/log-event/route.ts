import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

export async function handleLogEvent(
  supabase: SupabaseClient,
  { eventType, eventData }: { eventType: string; eventData?: unknown }
) {
  const { userId } = await handleApiAuth(supabase);
  const { error } = await supabase.from('user_events').insert({
    user_id: userId,
    event_type: eventType,
    event_data: eventData ?? null,
  });
  if (error) {
    console.error('Failed to log event', error);
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
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
  const body = await req.json();
  return handleLogEvent(supabase, {
    eventType: body.eventType,
    eventData: body.eventData,
  });
}
