"use client";

/**
 * Maps technical auth/API failures to safe, user-friendly messages.
 * Never surfaces raw backend text (table names, SQL fragments, tokens).
 */
export function friendlyError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = raw.toLowerCase();

  if (/invalid login credentials|invalid email or password/.test(msg))
    return "Wrong email or password. Please try again.";
  if (/user not found|email not confirmed|email not registered/.test(msg))
    return "No account found for this email. Please sign up first.";
  if (/user already registered|already exists|duplicate/.test(msg))
    return "This email is already registered. Please log in instead.";
  if (/password should be|weak password|password is too short/.test(msg))
    return "Please choose a stronger password (min. 6 characters).";
  if (/email rate limit|rate limit|too many|429/.test(msg))
    return "Too many attempts. Please wait a bit and try again.";
  if (/network|fetch failed|failed to fetch|timeout|abort/.test(msg))
    return "Network trouble. Check your connection and retry.";
  if (/forbidden|not authorized|jwt|token|session|expired/.test(msg))
    return "Your session expired. Please log in again.";
  if (!raw || /^\s*$/.test(raw)) return "Something went wrong. Please try again.";
  // Short, plausible backend messages pass through; long/technical ones don't.
  if (raw.length <= 120 && !/[{};<>\\]/.test(raw)) return raw;
  return "Something went wrong. Please try again.";
}
