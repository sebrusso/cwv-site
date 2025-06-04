import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

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
            // ignore cookie errors
          }
        },
      },
    }
  );
}

async function handleAnonymousSession(
  supabase: SupabaseClient,
  payload: { sessionId: string; evaluationsCount?: number; convertedToUserId?: string }
) {
  const { sessionId, evaluationsCount, convertedToUserId } = payload;

  const { error } = await supabase.from('anonymous_sessions').upsert(
    {
      session_id: sessionId,
      evaluations_count: evaluationsCount,
      converted_to_user_id: convertedToUserId,
    },
    { onConflict: 'session_id' }
  );

  if (error) {
    console.error('Failed to save anonymous session', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  const supabase = await getClient();
  const payload = await req.json();
  return handleAnonymousSession(supabase, payload);
}
