-- =====================================================================
-- Pickleball discounted-slot platform: initial database
--
-- Plain-language summary of the rules enforced here:
--   * Anyone (even without logging in) can see available, unbooked slots.
--   * Players must log in (email) to book. A booking is confirmed at once.
--   * A slot can only ever have ONE active booking (database-enforced).
--   * Discounted price must be 20-30% below the normal price.
--   * Players can cancel for free up to 4 hours before the start.
--   * Court-owner venues must be approved by a platform admin.
--   * Each venue has 1 or 2 venue admins; they only see their own venue.
--   * Players only see their own bookings.
-- All times are stored with time zone; the app shows Hong Kong time.
-- =====================================================================

create extension if not exists btree_gist;   -- needed for "no overlapping slots"
create extension if not exists pgcrypto;     -- random booking codes

-- ---------------------------------------------------------------------
-- Profiles: one row per logged-in person (created automatically at sign-up)
-- ---------------------------------------------------------------------
create table public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  full_name         text,
  phone             text,                    -- WhatsApp number, collected at sign-up
  phone_verified_at timestamptz,             -- set once SMS verification is switched on
  is_platform_admin boolean not null default false,  -- you; set by hand in Supabase
  created_at        timestamptz not null default now(),
  constraint phone_format check (phone is null or phone ~ '^\+?[0-9 ]{8,16}$')
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stop people from making themselves platform admin.
create function public.protect_profile_admin_flag() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.is_platform_admin is distinct from old.is_platform_admin
     and coalesce(auth.role(), '') in ('anon', 'authenticated') then
    raise exception 'You cannot change admin status';
  end if;
  return new;
end $$;

create trigger profiles_protect_admin
  before update on public.profiles
  for each row execute function public.protect_profile_admin_flag();

-- ---------------------------------------------------------------------
-- Districts and regions
-- ---------------------------------------------------------------------
create type public.region as enum ('Hong Kong Island', 'Kowloon', 'New Territories');

create table public.districts (
  name   text primary key,
  region public.region not null
);

insert into public.districts (name, region) values
  ('Central and Western', 'Hong Kong Island'),
  ('Eastern',             'Hong Kong Island'),
  ('Southern',            'Hong Kong Island'),
  ('Wan Chai',            'Hong Kong Island'),
  ('Kowloon City',        'Kowloon'),
  ('Kwun Tong',           'Kowloon'),
  ('Sham Shui Po',        'Kowloon'),
  ('Wong Tai Sin',        'Kowloon'),
  ('Yau Tsim Mong',       'Kowloon'),
  ('Islands',             'New Territories'),
  ('Kwai Tsing',          'New Territories'),
  ('North',               'New Territories'),
  ('Sai Kung',            'New Territories'),
  ('Sha Tin',             'New Territories'),
  ('Tai Po',              'New Territories'),
  ('Tsuen Wan',           'New Territories'),
  ('Tuen Mun',            'New Territories'),
  ('Yuen Long',           'New Territories');

-- ---------------------------------------------------------------------
-- Venues, venue admins, courts
-- ---------------------------------------------------------------------
create type public.venue_status as enum ('pending', 'approved', 'rejected', 'suspended');

create table public.venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) > 0),
  address     text not null,
  district    text not null references public.districts (name),
  region      public.region not null,          -- filled in automatically from district
  whatsapp    text not null,
  status      public.venue_status not null default 'pending',
  created_by  uuid not null default auth.uid() references public.profiles (id),
  approved_at timestamptz,
  created_at  timestamptz not null default now()
);

create function public.venue_set_region() returns trigger
language plpgsql set search_path = '' as $$
begin
  select d.region into new.region from public.districts d where d.name = new.district;
  return new;
end $$;

create trigger venues_set_region
  before insert or update of district on public.venues
  for each row execute function public.venue_set_region();

-- Only a platform admin may approve/reject a venue.
create function public.protect_venue_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') and not public.is_platform_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.approved_at := null;
      new.created_by := auth.uid();
    elsif new.status is distinct from old.status
       or new.approved_at is distinct from old.approved_at
       or new.created_by is distinct from old.created_by then
      raise exception 'Only a platform admin can change venue approval';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then
    new.approved_at := now();
  end if;
  return new;
end $$;

create table public.venue_admins (
  venue_id   uuid not null references public.venues (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);

create table public.courts (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues (id) on delete cascade,
  name       text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (venue_id, name)
);

-- Helper checks used by the permission rules below.
create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select is_platform_admin from public.profiles where id = auth.uid()), false)
$$;

create function public.is_venue_admin(p_venue_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.venue_admins
                 where venue_id = p_venue_id and user_id = auth.uid())
$$;

create trigger venues_protect_status
  before insert or update on public.venues
  for each row execute function public.protect_venue_status();

-- When an owner applies with a new venue: they become its first admin
-- and the venue gets a default "Court 1".
create function public.venue_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.venue_admins (venue_id, user_id) values (new.id, new.created_by);
  insert into public.courts (venue_id, name) values (new.id, 'Court 1');
  return new;
end $$;

create trigger venues_after_insert
  after insert on public.venues
  for each row execute function public.venue_after_insert();

-- At most 2 admins per venue.
create function public.limit_venue_admins() returns trigger
language plpgsql set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.venue_id::text));
  if (select count(*) from public.venue_admins where venue_id = new.venue_id) >= 2 then
    raise exception 'A venue can have at most 2 admins';
  end if;
  return new;
end $$;

create trigger venue_admins_limit
  before insert on public.venue_admins
  for each row execute function public.limit_venue_admins();

-- ---------------------------------------------------------------------
-- Slots
-- ---------------------------------------------------------------------
create type public.slot_status as enum ('open', 'cancelled');

create table public.slots (
  id               uuid primary key default gen_random_uuid(),
  court_id         uuid not null references public.courts (id) on delete cascade,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  normal_price     numeric(10, 2) not null check (normal_price > 0),
  discounted_price numeric(10, 2) not null check (discounted_price > 0),
  discount_pct     numeric(5, 1) generated always as
                     (round((1 - discounted_price / normal_price) * 100, 1)) stored,
  status           public.slot_status not null default 'open',
  created_at       timestamptz not null default now(),
  constraint slot_time_order check (ends_at > starts_at),
  -- The 20-30% discount band, checked on the exact prices.
  constraint discount_in_band check (
    discounted_price between normal_price * 0.70 and normal_price * 0.80
  ),
  -- No two active slots may overlap on the same court.
  constraint no_overlapping_slots exclude using gist (
    court_id with =, tstzrange(starts_at, ends_at) with &&
  ) where (status = 'open')
);

create index slots_starts_at_idx on public.slots (starts_at);

create function public.slot_must_be_future() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.starts_at <= now() then
    raise exception 'Slots must start in the future';
  end if;
  return new;
end $$;

create trigger slots_future_on_insert
  before insert on public.slots
  for each row execute function public.slot_must_be_future();

create trigger slots_future_on_retime
  before update of starts_at, ends_at on public.slots
  for each row execute function public.slot_must_be_future();

-- ---------------------------------------------------------------------
-- Bookings
-- ---------------------------------------------------------------------
create type public.booking_status as enum ('confirmed', 'cancelled');
create type public.attendance as enum ('attended', 'no_show');

create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  slot_id       uuid not null references public.slots (id) on delete restrict,
  player_id     uuid not null references public.profiles (id),
  booking_code  text not null unique,
  player_name   text not null,      -- copied from the profile at booking time,
  player_phone  text not null,      -- so the venue sees who booked
  status        public.booking_status not null default 'confirmed',
  attendance    public.attendance,
  cancelled_at  timestamptz,
  cancelled_by  text check (cancelled_by in ('player', 'venue')),
  created_at    timestamptz not null default now()
);

-- THE double-booking guard: only one confirmed booking per slot, ever.
create unique index one_active_booking_per_slot
  on public.bookings (slot_id) where (status = 'confirmed');

create index bookings_player_idx on public.bookings (player_id);

-- ---------------------------------------------------------------------
-- Actions (the app calls these instead of writing to tables directly,
-- so the rules can't be skipped)
-- ---------------------------------------------------------------------

-- Book a slot. Returns the new booking (with its code).
create function public.book_slot(p_slot_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles;
  v_slot    public.slots;
  v_booking public.bookings;
  v_code    text;
begin
  if auth.uid() is null then
    raise exception 'Please log in to book';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.full_name is null or v_profile.phone is null then
    raise exception 'Please add your name and phone number before booking';
  end if;

  select s.* into v_slot
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.id = p_slot_id and s.status = 'open' and v.status = 'approved'
  for update of s;

  if not found then
    raise exception 'This slot is not available';
  end if;
  if v_slot.starts_at <= now() then
    raise exception 'This slot has already started';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  begin
    insert into public.bookings (slot_id, player_id, booking_code, player_name, player_phone)
    values (p_slot_id, auth.uid(), v_code, v_profile.full_name, v_profile.phone)
    returning * into v_booking;
  exception when unique_violation then
    raise exception 'Sorry, this slot was just booked by someone else';
  end;

  return v_booking;
end $$;

-- Player cancels: free, allowed until 4 hours before the start.
create function public.cancel_booking(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_start   timestamptz;
begin
  select b.* into v_booking
  from public.bookings b
  where b.id = p_booking_id and b.player_id = auth.uid() and b.status = 'confirmed'
  for update;

  if not found then
    raise exception 'Booking not found';
  end if;
  select s.starts_at into v_start from public.slots s where s.id = v_booking.slot_id;
  if now() > v_start - interval '4 hours' then
    raise exception 'Free cancellation closes 4 hours before the start';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'player'
   where id = p_booking_id
  returning * into v_booking;
  return v_booking;
end $$;

-- Venue admin cancels a slot (and any booking on it).
create function public.cancel_slot(p_slot_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_venue uuid;
begin
  select c.venue_id into v_venue
  from public.slots s join public.courts c on c.id = s.court_id
  where s.id = p_slot_id;

  if v_venue is null or not public.is_venue_admin(v_venue) then
    raise exception 'Slot not found';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'venue'
   where slot_id = p_slot_id and status = 'confirmed';
  update public.slots set status = 'cancelled' where id = p_slot_id;
end $$;

-- Venue admin marks attendance (only once the slot has started).
create function public.mark_attendance(p_booking_id uuid, p_value public.attendance)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_venue uuid;
  v_start timestamptz;
begin
  select c.venue_id, s.starts_at into v_venue, v_start
  from public.bookings b
  join public.slots s on s.id = b.slot_id
  join public.courts c on c.id = s.court_id
  where b.id = p_booking_id and b.status = 'confirmed';

  if v_venue is null or not public.is_venue_admin(v_venue) then
    raise exception 'Booking not found';
  end if;
  if now() < v_start then
    raise exception 'Attendance can be marked once the slot has started';
  end if;

  update public.bookings set attendance = p_value where id = p_booking_id;
end $$;

-- Public search of available (unbooked, future) slots. Works without login.
create function public.search_available_slots(
  p_region     public.region default null,
  p_district   text          default null,
  p_name       text          default null,   -- matches venue or court name
  p_from_date  date          default null,   -- Hong Kong dates
  p_to_date    date          default null,
  p_from_time  time          default null,   -- Hong Kong times of day
  p_to_time    time          default null
)
returns table (
  slot_id          uuid,
  starts_at        timestamptz,
  ends_at          timestamptz,
  normal_price     numeric,
  discounted_price numeric,
  discount_pct     numeric,
  court_name       text,
  venue_id         uuid,
  venue_name       text,
  address          text,
  district         text,
  region           public.region,
  venue_whatsapp   text
)
language sql stable security definer set search_path = '' as $$
  select s.id, s.starts_at, s.ends_at, s.normal_price, s.discounted_price, s.discount_pct,
         c.name, v.id, v.name, v.address, v.district, v.region, v.whatsapp
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.status = 'open'
    and v.status = 'approved'
    and s.starts_at > now()
    and not exists (select 1 from public.bookings b
                    where b.slot_id = s.id and b.status = 'confirmed')
    and (p_region   is null or v.region = p_region)
    and (p_district is null or v.district = p_district)
    and (p_name     is null or v.name ilike '%' || p_name || '%'
                            or c.name ilike '%' || p_name || '%')
    and (p_from_date is null or (s.starts_at at time zone 'Asia/Hong_Kong')::date >= p_from_date)
    and (p_to_date   is null or (s.starts_at at time zone 'Asia/Hong_Kong')::date <= p_to_date)
    and (p_from_time is null or (s.starts_at at time zone 'Asia/Hong_Kong')::time >= p_from_time)
    and (p_to_time   is null or (s.ends_at   at time zone 'Asia/Hong_Kong')::time <= p_to_time)
  order by s.starts_at
$$;

-- ---------------------------------------------------------------------
-- Permissions (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.districts    enable row level security;
alter table public.venues       enable row level security;
alter table public.venue_admins enable row level security;
alter table public.courts       enable row level security;
alter table public.slots        enable row level security;
alter table public.bookings     enable row level security;

-- Profiles: you see and edit your own; platform admin sees all.
create policy "own profile read"   on public.profiles for select
  using (id = auth.uid() or public.is_platform_admin());
create policy "own profile update" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- Districts: public list.
create policy "districts public" on public.districts for select using (true);

-- Venues: public sees approved ones; admins see their own; platform admin all.
create policy "venues read" on public.venues for select
  using (status = 'approved' or created_by = auth.uid()
         or public.is_venue_admin(id) or public.is_platform_admin());
create policy "venues apply" on public.venues for insert to authenticated
  with check (true);  -- status forced to 'pending' by trigger
create policy "venues edit own" on public.venues for update
  using (public.is_venue_admin(id) or public.is_platform_admin())
  with check (public.is_venue_admin(id) or public.is_platform_admin());

-- Venue admins: only the platform admin assigns/removes them.
create policy "venue admins read" on public.venue_admins for select
  using (user_id = auth.uid() or public.is_venue_admin(venue_id) or public.is_platform_admin());
create policy "venue admins assign" on public.venue_admins for insert
  with check (public.is_platform_admin());
create policy "venue admins remove" on public.venue_admins for delete
  using (public.is_platform_admin());

-- Courts: public sees courts of approved venues; venue admins manage their own.
create policy "courts read" on public.courts for select
  using (public.is_venue_admin(venue_id) or public.is_platform_admin()
         or exists (select 1 from public.venues v where v.id = venue_id and v.status = 'approved'));
create policy "courts insert" on public.courts for insert
  with check (public.is_venue_admin(venue_id));
create policy "courts update" on public.courts for update
  using (public.is_venue_admin(venue_id)) with check (public.is_venue_admin(venue_id));
create policy "courts delete" on public.courts for delete
  using (public.is_venue_admin(venue_id));

-- Slots: raw table only for the venue's own admins (public uses the search function).
create policy "slots read own venue" on public.slots for select
  using (public.is_platform_admin() or exists (
    select 1 from public.courts c where c.id = court_id and public.is_venue_admin(c.venue_id)));
create policy "slots insert own venue" on public.slots for insert
  with check (status = 'open' and exists (
    select 1 from public.courts c where c.id = court_id and public.is_venue_admin(c.venue_id)));
create policy "slots update own venue" on public.slots for update
  using (exists (select 1 from public.courts c
                 where c.id = court_id and public.is_venue_admin(c.venue_id)))
  with check (exists (select 1 from public.courts c
                      where c.id = court_id and public.is_venue_admin(c.venue_id)));

-- Bookings: players see their own; venue admins see bookings at their venue.
-- No direct insert/update/delete: everything goes through the actions above.
create policy "bookings read" on public.bookings for select
  using (player_id = auth.uid() or public.is_platform_admin() or exists (
    select 1 from public.slots s join public.courts c on c.id = s.court_id
    where s.id = slot_id and public.is_venue_admin(c.venue_id)));

-- Booked slots can't have their prices or times changed under the player.
create function public.lock_booked_slot() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.starts_at, new.ends_at, new.normal_price, new.discounted_price, new.court_id)
     is distinct from
     (old.starts_at, old.ends_at, old.normal_price, old.discounted_price, old.court_id)
     and exists (select 1 from public.bookings b
                 where b.slot_id = old.id and b.status = 'confirmed') then
    raise exception 'This slot is booked; cancel it instead of editing';
  end if;
  if new.status = 'cancelled' and old.status = 'open'
     and coalesce(auth.role(), '') in ('anon', 'authenticated')
     and exists (select 1 from public.bookings b
                 where b.slot_id = old.id and b.status = 'confirmed') then
    raise exception 'Use the cancel slot action so the player booking is cancelled too';
  end if;
  return new;
end $$;

create trigger slots_lock_booked
  before update on public.slots
  for each row execute function public.lock_booked_slot();

-- Function access
revoke execute on function public.book_slot(uuid)                         from public, anon;
revoke execute on function public.cancel_booking(uuid)                    from public, anon;
revoke execute on function public.cancel_slot(uuid)                       from public, anon;
revoke execute on function public.mark_attendance(uuid, public.attendance) from public, anon;
grant  execute on function public.book_slot(uuid)                         to authenticated;
grant  execute on function public.cancel_booking(uuid)                    to authenticated;
grant  execute on function public.cancel_slot(uuid)                       to authenticated;
grant  execute on function public.mark_attendance(uuid, public.attendance) to authenticated;
grant  execute on function public.search_available_slots(public.region, text, text, date, date, time, time)
  to anon, authenticated;
