-- Digital Tailor Nagpur — Site content (homepage text managed from /admin → Content)
-- Run in Supabase Dashboard → SQL Editor (run schema3.sql first if you haven't yet).
-- Safe to re-run (uses IF NOT EXISTS + DROP POLICY IF EXISTS).
-- Until rows exist, the site shows built-in demo content.

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Everyone (even logged-out visitors) can read content.
-- Writes go through the service_role key in /api/admin/content only.
drop policy if exists "Public can view site content" on public.site_content;
create policy "Public can view site content"
  on public.site_content for select
  to anon, authenticated
  using (true);
