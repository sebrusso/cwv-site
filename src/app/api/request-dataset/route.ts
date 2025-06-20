import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function handleRequest(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let userId: string | null = null;

    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
      );
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      userId = cookieStore.get('anonymous_session_id')?.value || null;
    }

    if (!userId) {
      userId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      cookieStore.set('anonymous_session_id', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365
      });
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    await admin.from('dataset_download_emails').insert({ email });
    await admin.from('dataset_downloads').insert({ user_id: userId });

    const url = process.env.DATASET_URL;
    if (!url) {
      return NextResponse.json({ error: 'Dataset URL not configured' }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Error in request-dataset API:', err);
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handleRequest(req);
}
