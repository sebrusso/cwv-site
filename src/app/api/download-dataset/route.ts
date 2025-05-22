import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function handleDownloadDataset(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = process.env.DATASET_URL;
  if (!url) {
    return NextResponse.json({ error: 'Dataset URL not configured' }, { status: 500 });
  }
  // Record the download but ignore any errors
  await supabase.from('dataset_downloads').insert({ user_id: session.user.id });
  return NextResponse.json({ url });
}

export async function GET() {
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
            // ignore cookie setting errors
          }
        },
      },
    }
  );

  return handleDownloadDataset(supabase);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = process.env.DATASET_URL;
  if (!url) {
    return NextResponse.json({ error: 'Dataset URL not configured' }, { status: 500 });
  }
  // Record the download in Supabase
  const { error } = await supabase.from('dataset_downloads').insert({
    user_id: session.user.id,
  });
  if (error) {
    console.error('Failed to record dataset download', error);
  }
  return NextResponse.json({ url });
}
