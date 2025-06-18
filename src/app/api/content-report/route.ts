import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleApiAuth } from '@/lib/auth-utils';

async function handleContentReport(
  admin: SupabaseClient,
  payload: { contentType: string; contentId: string; reason: string },
  userId: string | null,
) {
  // userId is now either a real user ID or an anonymous session ID
  const { error } = await admin.from('content_reports').insert({
    user_id: userId,
    content_type: payload.contentType,
    content_id: payload.contentId,
    reason: payload.reason,
  });
  if (error) {
    console.error('Failed to save content report', error);
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
    const { contentType, contentId, reason } = body ?? {};
    if (!contentType || !contentId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const { userId, isAuthenticated } = await handleApiAuth(req);
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return handleContentReport(admin, { contentType, contentId, reason }, userId);
  } catch (err) {
    console.error('Error in content-report API:', err);
    return NextResponse.json({ error: 'Failed to save content report' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { data, error } = await supabase
    .from('content_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { id, resolved } = await req.json();
  const { error } = await supabase
    .from('content_reports')
    .update({ resolved })
    .eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
