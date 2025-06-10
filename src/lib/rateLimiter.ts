export interface RateLimitOptions {
  userMax: number;
  anonMax: number;
  windowMs: number;
}

interface RateRecord {
  count: number;
  expires: number;
}

const records = new Map<string, RateRecord>();

export function checkRateLimit(id: string, isAnon: boolean, options: RateLimitOptions): boolean {
  const now = Date.now();
  const max = isAnon ? options.anonMax : options.userMax;
  const record = records.get(id);

  if (record && record.expires > now) {
    if (record.count >= max) {
      return false;
    }
    record.count += 1;
    records.set(id, record);
    return true;
  }

  // New record or expired
  records.set(id, { count: 1, expires: now + options.windowMs });
  return true;
}

export function resetRateLimit(id: string) {
  records.delete(id);
}
