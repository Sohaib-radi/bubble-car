-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- ── profiles ──────────────────────────────────────────────
-- One row per auth user, holding the app-specific fields your
-- Register screen collects beyond email/password.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── cars ──────────────────────────────────────────────────
create table public.cars (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,        -- e.g. "Mercedes C300"
  plate text not null,       -- e.g. "234 ABC"
  created_at timestamptz not null default now()
);

alter table public.cars enable row level security;

create policy "Users can view own cars"
  on public.cars for select
  using (auth.uid() = owner_id);

create policy "Users can insert own cars"
  on public.cars for insert
  with check (auth.uid() = owner_id);

create policy "Users can update own cars"
  on public.cars for update
  using (auth.uid() = owner_id);

create policy "Users can delete own cars"
  on public.cars for delete
  using (auth.uid() = owner_id);

-- ── bookings ──────────────────────────────────────────────
create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  car_id uuid not null references public.cars (id) on delete cascade,
  service_key text not null,     -- e.g. 'full'
  service_name text not null,    -- e.g. 'Full Detail'
  price numeric(10, 2) not null,
  booking_date date not null,
  booking_time text not null,    -- e.g. '14:30'
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own bookings"
  on public.bookings for update
  using (auth.uid() = user_id);

-- ── auto-create profile row on signup ────────────────────
-- Populates public.profiles from the metadata passed to
-- supabase.auth.signUp({ options: { data: { full_name, phone, address } } })
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone',
    new.raw_user_meta_data ->> 'address'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
