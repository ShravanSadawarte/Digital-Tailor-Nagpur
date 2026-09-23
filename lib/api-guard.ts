/**
 * Server-side guards: safe errors, same-origin CSRF check, in-memory rate limit.
 * Framework-free (no next/* imports) so the logic is unit-testable in Node.
 */

import { ValidationError } from "./validate";

/** Client-safe error message: generic in production, detailed in dev. */
export function safeError(err: unknown, publicMessage = "Request failed."): string {
  if (err instanceof ValidationError) return err.message; // always safe, our own text
  const isProd =
    typeof process !== "undefined" && process.env?.NODE_ENV === "production";
  if (!isProd && err instanceof Error && err.message) return err.message;
  return publicMessage;
}

/** Best-effort client IP (Vercel sets x-forwarded-for). Never logged raw. */
export function clientIp(headers: { get: (k: string) => string | null }): string {
  const fwd = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "";
  return fwd.split(",")[0].trim().slice(0, 64) || "unknown";
}

/**
 * Same-origin check for cookie-authed mutations (CSRF depth on top of
 * SameSite=Lax cookies). Browsers always send Origin/Referer on POST/PUT/
 * PATCH/DELETE; bare API clients send neither and are allowed through.
 */
export function isSameOrigin(
  host: string,
  origin: string | null,
  referer: string | null
): boolean {
  const h = (host || "").toLowerCase().split(",")[0].trim();
  const same = (url: string) => {
    try {
      return new URL(url).host.toLowerCase() === h;
    } catch {
      return false;
    }
  };
  if (origin) return same(origin);
  if (referer) return same(referer);
  return true;
}

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

/**
 * Sliding-window in-memory limiter (per server instance). On serverless this
 * is defense-in-depth, not a distributed guarantee — the brute-forceable
 * surface here (one admin passcode) is additionally low-value and alerted by
 * Supabase's own edge limits. Returns false when the caller must stop.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b) {
    b = { hits: [] };
    buckets.set(key, b);
  }
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= limit) return false;
  b.hits.push(now);
  // Prevent unbounded growth from key enumeration.
  if (buckets.size > 2000) {
    const oldest = buckets.keys().next().value;
    if (oldest) buckets.delete(oldest);
  }
  return true;
}

/** Test hook: reset limiter state. */
export function __resetRateLimits() {
  buckets.clear();
}
