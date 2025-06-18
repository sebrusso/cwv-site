import { NextResponse } from 'next/server';
import { handleApiAuth } from '@/lib/auth-utils';

async function handleDownloadDataset(req: Request) {
  const { userId, isAuthenticated, supabase } = await handleApiAuth(req);
  
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const url = process.env.DATASET_URL;
  if (!url) {
    return NextResponse.json({ error: 'Dataset URL not configured' }, { status: 500 });
  }
  
  // Record the download with either real user ID or anonymous session ID
  await supabase.from('dataset_downloads').insert({ user_id: userId });
  return NextResponse.json({ url });
}

export async function GET(req: Request) {
  return handleDownloadDataset(req);
}
