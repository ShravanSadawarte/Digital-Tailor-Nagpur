# Caching

## Why
Every storefront visit refetched the same public Supabase rows (catalog, QR,
announcements, homepage copy). The app runs serverless, so per-instance memory
rarely hits and Redis would add a vendor, cost, and secrets for no real gain at
this scale. A versioned TTL cache in the browser removes those repeat
round-trips with zero infrastructure.

## What is cached (public reads only)
| Group | Entries | TTL | Invalidated by |
|---|---|---|---|
| `catalog` | home/shop products, categories, materials, transformation examples, offers | 300s | admin catalog create/update/delete |
| `settings` | UPI QR (`shop_settings`) | 600s | admin settings save |
| `announcements` | active top-bar messages | 300s | admin announcement create/toggle/delete |
| `content` | hero/services/sections copy | 600s | admin content save |

## What is NEVER cached
User-scoped rows (profiles, measurements, shop/custom orders, bookings),
admin order lists (freshness-critical), auth/session/tokens. Cache keys contain
only resource names — no user IDs, emails, or secrets.

## Provider / mechanism
No Redis, no new dependencies. `lib/data-cache.ts` (framework-free):
in-memory map (cap 60) + `localStorage` persistence, per-group version
numbers, in-flight request coalescing (stampede protection).

Key format: `dtc:v1:{group}:{version}:{name}`. Versions live in
`localStorage`, so all tabs share invalidation.

## How it behaves
Request → versioned key lookup (memory, then storage) → hit returns, miss
fetches once even under concurrency → result stored with TTL → returned.
Storage/quota failures fall through to a live fetch; fetch failures throw (no
stale masking). Cache events log via `console.debug` in development only.

Admin uploads need no invalidation: files get fresh timestamped paths.

## Env vars / setup
None. Works in local dev and production with no configuration. No secrets
involved (`.env.example` unchanged).

## Disabling
Delete the `cached(...)` wrappers (revert to direct Supabase calls) or call
`invalidate(group)`. The app functions identically without the cache.
