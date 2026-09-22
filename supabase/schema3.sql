-- Digital Tailor Nagpur — Announcements (top bar managed from /admin)
-- Run in Supabase Dashboard → SQL Editor AFTER supabase/schema2.sql
-- Safe to re-run (uses IF NOT EXISTS + DROP POLICY IF EXISTS).

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Everyone (even logged-out visitors) can read ACTIVE announcements.
-- Writes go through the service_role key in /api/admin/announcements only.
drop policy if exists "Public can view active announcements" on public.announcements;
create policy "Public can view active announcements"
  on public.announcements for select
  to anon, authenticated
  using (active = true);
