import { supabase } from './supabase/client';

export const ANON_SESSION_KEY = 'anonymousSessionId';
const STORAGE_KEY = 'anonymous_session_id';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeDays = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}`;
}

export function getAnonymousSessionId(): string | null {
  if (typeof window === 'undefined') return null;

  let id = window.localStorage.getItem(ANON_SESSION_KEY) || getCookie(ANON_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    try { window.localStorage.setItem(ANON_SESSION_KEY, id); } catch {}
    try { setCookie(ANON_SESSION_KEY, id); } catch {}
  }
  return id;
}

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
