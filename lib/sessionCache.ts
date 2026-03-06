export interface CachedSession {
  sessionId: string;
  csrfToken: string;
  cookies: string;
  createdAt: number;
}

const SESSION_TTL_MS = 10 * 60 * 1000; 

const cache = new Map<string, CachedSession>();

export function getCachedSession(username: string): CachedSession | null {
  const entry = cache.get(username.toUpperCase());
  if (!entry) return null;

  if (Date.now() - entry.createdAt > SESSION_TTL_MS) {
    console.log("[CACHE] Session expired for:", username);
    cache.delete(username.toUpperCase());
    return null;
  }

  console.log("[CACHE] Reusing cached session for:", username);
  return entry;
}

export function setCachedSession(
  username: string,
  session: Omit<CachedSession, "createdAt">
): void {
  console.log("[CACHE] Storing session for:", username);
  cache.set(username.toUpperCase(), {
    ...session,
    createdAt: Date.now(),
  });
}

export function invalidateCachedSession(username: string): void {
  console.log("[CACHE] Invalidating session for:", username);
  cache.delete(username.toUpperCase());
}
