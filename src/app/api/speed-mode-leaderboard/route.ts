import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { AggregatedSpeedEntry } from '@/lib/speed-utils';
import { handleSpeedModeLeaderboard as aggregate } from '@/lib/speed-utils';

export type SpeedModeEntry = AggregatedSpeedEntry;

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

  return aggregate(supabase);
}
