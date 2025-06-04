import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

async function getClient() {
  const cookieStorePromise = cookies();
  return createServerClient(
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
            // ignore cookie setting errors
          }
        },
      },
    }
  );
}

async function handleActivityLog(
  supabase: SupabaseClient,
  payload: { type: string; data?: unknown }
) {
  const { userId, isAuthenticated } = await handleApiAuth(supabase);

  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { type, data } = payload;
  if (!type) {
    return NextResponse.json({ error: 'Missing type' }, { status: 400 });
  }

  const { error } = await supabase.from('user_activity_log').insert({
    user_id: userId,
    activity_type: type,
    activity_data: data ?? null,
  });

  if (error) {
    console.error('Failed to save activity log', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const supabase = await getClient();
  const payload = await req.json();
  return handleActivityLog(supabase, payload);
}
