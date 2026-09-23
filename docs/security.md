# Security

## Authentication architecture
Supabase Auth owns credentials end-to-end (bcrypt server-side, rate-limited
by Supabase). Passwords never touch our code — no custom hashing, by design.
Sessions live in Supabase SSR cookies (`sb-*`, HttpOnly, `SameSite=Lax`,
`Secure` in production, refreshed by `middleware.ts` on every request).
The admin layer adds a second factor: `dt_admin` cookie (HMAC of the admin
email under `ADMIN_PASSCODE`; HttpOnly, `Secure` in prod, `SameSite=Lax`,
7-day expiry, cleared on logout). No tokens in app-controlled storage.

## Cookies
| Cookie | HttpOnly | Secure (prod) | SameSite | Cleared on logout |
|---|---|---|---|---|
| Supabase `sb-*` session | yes | yes | Lax | yes (`signOut`) |
| `dt_admin` | yes | yes | Lax | yes (`/api/admin/auth` logout) |

`localStorage` holds only the shopping bag and public-data cache — never
credentials. Supabase's own default token storage is accepted as their
documented SPA architecture (changing it would fork auth for no gain).

## Authorization
Every `/api/admin/*` route requires `isAdminRequest()` (session email ==
`ADMIN_EMAIL` (case-insensitive) + valid `dt_admin` cookie). RLS enforces
row ownership in Postgres; the service-role key never leaves the server.
`/api/proof` verifies `order.user_id === user.id` (IDOR-safe). Admin catalog
writes use per-resource field allowlists; order updates accept only
`status`/`payment_status` with enum values.

## CSRF
State-changing cookie-authed routes (`/api/admin/*` POST/PUT/PATCH/DELETE,
`/api/proof`) enforce a same-origin check (`Origin`/`Referer` must match the
request host) on top of `SameSite=Lax` cookies. Bare API clients (no
Origin/Referer) still pass.

## Rate limiting
In-memory sliding window (per instance; defense-in-depth on serverless):
admin passcode verify → 10 attempts / 10 min / IP (429 + friendly message).
Login/signup abuse is covered by Supabase edge limits.

## Validation (`lib/validate.ts`)
All admin writes validated server-side: field allowlists (no `id`/
`created_at` injection), string length caps, int ranges, UUIDs, enums,
`YYYY-MM-DD` dates, https URLs. Uploads: images only (JPG/PNG/WebP/GIF —
SVG/HTML rejected as stored-XSS vectors), 5MB cap, extension derived from
MIME, signed-URL paths allowlisted. Failures return 422 with safe messages.

## Error handling
Server: `safeError()` (`lib/api-guard.ts`) — validation messages pass
through, Supabase internals become "Request failed." in production (full
detail in dev). Response shapes unchanged. Client: `friendlyError()`
(`lib/client-error.ts`) maps auth/network failures to safe text. Crash
safety: `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx`
(no stack traces in production).

## Headers (`vercel.json`)
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`.
HSTS is provided by Vercel. No full CSP — Next.js hydration needs
`unsafe-inline`, which would neuter it; deferred deliberately.

## Encryption / hashing
No app-level encryption: no field justifies it (TLS in transit, Supabase
encryption at rest, RLS authorization). Passwords are hashed by Supabase,
never encrypted, never recoverable. No `ENCRYPTION_KEY` exists.

## Env vars
Public (`NEXT_PUBLIC_*`, inlined into JS by design): Supabase URL + anon key.
Server-only: `SUPABASE_SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSCODE`.
`.env.example` carries names only; `.env.local` is gitignored.

## Deliberately deferred
Redis-backed rate limits, full CSP, app-field encryption — cost/complexity
outweigh benefit at this scale; re-evaluate with traffic or PII growth.
