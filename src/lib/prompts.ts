import { supabase } from './supabase/client';

export async function getRandomPrompt(fields = 'id,prompt,chosen', excludeFlagged = false) {
  let excludeIds: string[] = [];
  if (excludeFlagged) {
    const { data: flagged } = await supabase
      .from('content_reports')
      .select('content_id')
      .eq('content_type', 'prompt')
      .eq('resolved', false);
    excludeIds = (flagged || []).map((r) => r.content_id);
  }

  let countQuery = supabase
    .from('writingprompts-pairwise-test')
    .select('id', { count: 'exact', head: true });
  if (excludeIds.length > 0) {
    countQuery = countQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  const { count } = await countQuery;
  if (!count || count === 0) return null;

  const offset = Math.floor(Math.random() * count);

  let dataQuery = supabase
    .from('writingprompts-pairwise-test')
    .select(fields)
    .range(offset, offset);
  if (excludeIds.length > 0) {
    dataQuery = dataQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }
  const { data, error } = await dataQuery;
  if (error || !data || data.length === 0) {
    console.error('Error fetching random prompt', error);
    return null;
  }
  return data[0];
}

export async function getRandomPromptId(excludeFlagged = false) {
  const row = await getRandomPrompt('id', excludeFlagged);
  return row ? row.id : null;
}
