-- Digital Tailor Nagpur — Boutique schema (Feature 1-4 + profile + tracking)
-- Run in Supabase Dashboard → SQL Editor AFTER supabase/schema.sql
-- Safe to re-run (uses IF NOT EXISTS + DROP POLICY IF EXISTS).

-- ---------- Profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- Measurements ----------
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null default 'My measurements',
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.measurements enable row level security;
drop policy if exists "Users manage own measurements" on public.measurements;
create policy "Users manage own measurements" on public.measurements
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind text not null default 'product',
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
drop policy if exists "Public can view categories" on public.categories;
create policy "Public can view categories" on public.categories
  for select to anon, authenticated using (true);

-- ---------- Products (Feature 1) ----------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price int not null default 0,
  mrp int,
  images text[] not null default '{}',
  sizes text[] not null default '{S,M,L,XL,XXL}',
  stock int not null default 0,
  available boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.products enable row level security;
drop policy if exists "Public can view products" on public.products;
create policy "Public can view products" on public.products
  for select to anon, authenticated using (true);

-- ---------- Transformation examples (Feature 2) ----------
create table if not exists public.transformation_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  dress_type text,
  description text,
  before_image text,
  after_image text,
  created_at timestamptz not null default now()
);
alter table public.transformation_examples enable row level security;
drop policy if exists "Public can view examples" on public.transformation_examples;
create policy "Public can view examples" on public.transformation_examples
  for select to anon, authenticated using (true);

-- ---------- Customization materials (Feature 3) ----------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  kind text not null, -- fabric | neck_front | neck_back | sleeve | decorative
  name text not null,
  description text,
  image_url text,
  price_addon int not null default 0,
  available boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.materials enable row level security;
drop policy if exists "Public can view materials" on public.materials;
create policy "Public can view materials" on public.materials
  for select to anon, authenticated using (true);

-- ---------- Shop settings (UPI QR etc.) ----------
create table if not exists public.shop_settings (
  id int primary key,
  upi_id text,
  upi_qr_url text,
  notice text
);
alter table public.shop_settings enable row level security;
drop policy if exists "Public can view settings" on public.shop_settings;
create policy "Public can view settings" on public.shop_settings
  for select to anon, authenticated using (true);
insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

-- ---------- Shop orders ----------
create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  items jsonb not null default '[]',
  total int not null default 0,
  name text not null,
  phone text not null,
  address text,
  payment_method text not null default 'cod', -- cod | online
  payment_status text not null default 'pending', -- pending | awaiting_verification | verified | rejected | paid_on_pickup | done
  proof_url text,
  status text not null default 'pending', -- pending | confirmed | stitching | ready | delivered | cancelled
  created_at timestamptz not null default now()
);
alter table public.shop_orders enable row level security;
drop policy if exists "Users create own shop orders" on public.shop_orders;
create policy "Users create own shop orders" on public.shop_orders
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users view own shop orders" on public.shop_orders;
create policy "Users view own shop orders" on public.shop_orders
  for select to authenticated using (auth.uid() = user_id);

-- ---------- Custom dress orders (Feature 3) ----------
create table if not exists public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  design_ref text,
  fabric_mode text not null default 'shop', -- shop | own
  fabric_material_id uuid references public.materials (id) on delete set null,
  fabric_own_desc text,
  neck_front text,
  neck_back text,
  sleeve text,
  decorative jsonb not null default '[]',
  own_notes text,
  reference_mode text not null default 'measurement', -- measurement | reference_dress
  measurement_id uuid references public.measurements (id) on delete set null,
  reference_dress_note text,
  estimate int not null default 0,
  name text not null,
  phone text not null,
  payment_method text not null default 'cod',
  payment_status text not null default 'pending',
  proof_url text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.custom_orders enable row level security;
drop policy if exists "Users create own custom orders" on public.custom_orders;
create policy "Users create own custom orders" on public.custom_orders
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users view own custom orders" on public.custom_orders;
create policy "Users view own custom orders" on public.custom_orders
  for select to authenticated using (auth.uid() = user_id);

-- ---------- Offers & promotions (Feature 5) ----------
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  conditions text,
  valid_from date,
  valid_to date,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.offers enable row level security;
drop policy if exists "Public can view active offers" on public.offers;
create policy "Public can view active offers" on public.offers
  for select to anon, authenticated using (active = true);
