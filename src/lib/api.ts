export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { retries?: number; backoffMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? 3;
  const backoffMs = options?.backoffMs ?? 500;
  let attempt = 0;

  while (true) {
    if (typeof window !== "undefined" && !navigator.onLine) {
      await new Promise((resolve) =>
        window.addEventListener("online", resolve, { once: true })
      );
    }
    try {
      const res = await fetch(input, init);
      if (!res.ok && res.status >= 500 && attempt < retries) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return res;
    } catch (err) {
      if (attempt >= retries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
      attempt += 1;
    }
  }
}

export async function postJsonWithRetry(
  url: string,
  data: unknown,
  options?: { retries?: number; backoffMs?: number }
) {
  return fetchWithRetry(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    options
  );
}
