import { supabase } from './supabase/client';

const STORAGE_KEY = 'anonymous_session_id';

export async function incrementAnonymousEvaluationsCount() {
  if (typeof window === 'undefined') return;

  try {
    let sessionId = localStorage.getItem(STORAGE_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, sessionId);
      await supabase
        .from('anonymous_sessions')
        .insert({ session_id: sessionId, evaluations_count: 1 });
      return;
    }

    const { data, error } = await supabase
      .from('anonymous_sessions')
      .select('evaluations_count')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      await supabase
        .from('anonymous_sessions')
        .insert({ session_id: sessionId, evaluations_count: 1 });
      return;
    }

    await supabase
      .from('anonymous_sessions')
      .update({ evaluations_count: data.evaluations_count + 1 })
      .eq('session_id', sessionId);
  } catch (err) {
    console.error('Failed to increment anonymous session evaluation count', err);
  }
}
