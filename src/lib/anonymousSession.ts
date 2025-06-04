export const ANON_SESSION_KEY = 'anonymousSessionId';

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
