-- AYMELEK central catalog foundation (Supabase/PostgreSQL)
-- Run in Supabase SQL editor after creating a project.
create extension if not exists pgcrypto;
create table if not exists public.store_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  category text not null,
  description text not null default '',
  currency text not null default 'TRY' check (currency='TRY'),
  price_cents bigint not null check (price_cents >= 0),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images)='array'),
  colors jsonb not null default '[]'::jsonb check (jsonb_typeof(colors)='array'),
  sizes jsonb not null default '{}'::jsonb check (jsonb_typeof(sizes)='object'),
  published boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check(status in ('pending','paid','cancelled','fulfilled')),
  total_cents bigint not null check(total_cents >= 0),
  created_at timestamptz not null default now()
);
alter table public.store_admins enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
create policy "Published products are readable" on public.products for select to anon, authenticated using (published = true or exists(select 1 from public.store_admins a where a.user_id=auth.uid()));
create policy "Admins insert products" on public.products for insert to authenticated with check (exists(select 1 from public.store_admins a where a.user_id=auth.uid()));
create policy "Admins update products" on public.products for update to authenticated using (exists(select 1 from public.store_admins a where a.user_id=auth.uid())) with check (exists(select 1 from public.store_admins a where a.user_id=auth.uid()));
create policy "Admins delete products" on public.products for delete to authenticated using (exists(select 1 from public.store_admins a where a.user_id=auth.uid()));
create policy "Admins read orders" on public.orders for select to authenticated using (exists(select 1 from public.store_admins a where a.user_id=auth.uid()));
-- Insert the owner's auth user id into store_admins from a trusted SQL session.
-- Never put Supabase service_role keys or payment secrets in GitHub Pages frontend.
