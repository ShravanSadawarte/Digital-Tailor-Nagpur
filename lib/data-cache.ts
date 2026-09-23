/**
 * Lightweight client-side cache for PUBLIC, read-heavy Supabase data.
 *
 * Why client-only (no Redis): the app runs serverless on Vercel, so per-instance
 * memory would rarely hit; traffic is boutique-scale; and every cacheable read is
 * already a public anon query. A versioned TTL cache in the browser removes the
 * repeated round-trips on every page visit with zero infra, zero secrets.
 *
 * What is cached: products, categories, materials, transformation examples,
 * offers, shop settings, announcements, site content. NEVER user-scoped rows
 * (profiles, measurements, orders, bookings) and NEVER auth/session data.
 *
 * Strategy per group: `v1:{group}:{version}:{name}` keys, TTL expiry, plus an
 * explicit version bump when the admin mutates data in the same browser
 * (cross-browser staleness is bounded by TTL). Concurrent identical requests
 * share one in-flight fetch (stampede protection).
 */

type Entry = { v: unknown; exp: number };

const PREFIX = "dtc:";
const MAX_ENTRIES = 60;

const mem = new Map<string, Entry>();
const memOrder: string[] = [];
const flying = new Map<string, Promise<unknown>>();

function log(event: "hit" | "miss" | "error" | "invalidate", key: string) {
  // Keys never contain user data (public resources only), safe to log.
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") return;
  if (typeof console !== "undefined" && typeof console.debug === "function") {
    console.debug(`[cache ${event}]`, key);
  }
}

function lsGet(key: string): Entry | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry;
    if (!parsed || typeof parsed.exp !== "number") return null;
    return parsed;
  } catch {
    // Corrupt/unavailable storage must never break the app.
    return null;
  }
}

function lsSet(key: string, entry: Entry) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota/private-mode failures are ignored; memory cache still works.
  }
}

function memSet(key: string, entry: Entry) {
  if (!mem.has(key)) {
    memOrder.push(key);
    while (memOrder.length > MAX_ENTRIES) {
      const oldest = memOrder.shift();
      if (oldest) mem.delete(oldest);
    }
  }
  mem.set(key, entry);
}

/** Current data version for a group (bumped on admin mutations). */
export function getVersion(group: string): number {
  const fromMem = mem.get(`${PREFIX}ver:${group}`);
  if (fromMem && typeof fromMem.v === "number") return fromMem.v;
  const stored = lsGet(`ver:${group}`);
  const v = stored && typeof stored.v === "number" ? stored.v : 0;
  mem.set(`${PREFIX}ver:${group}`, { v, exp: Number.POSITIVE_INFINITY });
  return v;
}

/**
 * Invalidate a group: future reads miss and refetch. Call after admin
 * CREATE/UPDATE/DELETE that affects the group. Safe to call repeatedly.
 */
export function invalidate(group: string): void {
  const next = getVersion(group) + 1;
  const verEntry = { v: next, exp: Number.POSITIVE_INFINITY };
  mem.set(`${PREFIX}ver:${group}`, verEntry);
  lsSet(`ver:${group}`, verEntry);
  // Drop this group's memory entries; persisted ones expire by TTL.
  for (const key of [...mem.keys()]) {
    if (key.startsWith(`${PREFIX}v1:${group}:`)) mem.delete(key);
  }
  log("invalidate", group);
}

/**
 * Cached read. On miss (or expiry) exactly one fetch runs even under
 * concurrency; storage failures fall through to a live fetch.
 */
export async function cached<T>(
  group: string,
  name: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const key = `v1:${group}:${getVersion(group)}:${name}`;
  const now = Date.now();

  const hit = mem.get(key) ?? lsGet(key);
  if (hit && hit.exp > now) {
    if (!mem.has(key)) memSet(key, hit);
    log("hit", key);
    return hit.v as T;
  }
  log("miss", key);

  const ongoing = flying.get(key);
  if (ongoing) return ongoing as Promise<T>;

  const run = (async () => {
    try {
      const value = await fetcher();
      const entry: Entry = { v: value, exp: Date.now() + ttlSeconds * 1000 };
      memSet(key, entry);
      lsSet(key, entry);
      return value;
    } catch (err) {
      log("error", key);
      throw err;
    } finally {
      flying.delete(key);
    }
  })();
  flying.set(key, run);
  return run;
}

/** TTLs (seconds) — matched to how fast each group changes. */
export const TTL = {
  /** Catalog lists change only on admin edits; version bump covers own edits. */
  catalog: 300,
  /** QR/notice change rarely. */
  settings: 600,
  /** Admin-published bar messages. */
  announcements: 300,
  /** Homepage copy blocks. */
  content: 600,
} as const;
