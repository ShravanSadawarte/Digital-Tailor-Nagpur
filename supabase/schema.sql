-- Digital Tailor Nagpur — Supabase schema
-- Run in Supabase Dashboard → SQL Editor → New query → Paste → Run

-- Contact form submissions (public can insert, nobody reads except service_role / dashboard)
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  phone text not null,
  message text not null
);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can submit contact messages" on public.contact_messages;
create policy "Anyone can submit contact messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- Bookings / stitching orders
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references auth.users (id) on delete set null,
  name text not null,
  phone text not null,
  service text not null,
  pickup_date date,
  notes text,
  status text not null default 'pending'
);

alter table public.bookings enable row level security;

drop policy if exists "Anyone can create bookings" on public.bookings;
create policy "Anyone can create bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Users can view own bookings" on public.bookings;
create policy "Users can view own bookings"
  on public.bookings for select
  to authenticated
  using (auth.uid() = user_id);
