export function createIdempotencyKey(prefix = "web") {
  // Lightweight, browser-safe unique key.
  // Format: web_<timestamp>_<random>
  const rand = Math.random().toString(16).slice(2);
  return `${prefix}_${Date.now()}_${rand}`;
}

export function idempotencyHeaders(key: string) {
  return { headers: { "idempotency-key": key } } as const;
}
