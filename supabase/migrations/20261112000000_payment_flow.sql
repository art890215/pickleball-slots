-- =====================================================================
-- Payment flow (players pay the venue directly by FPS / PayMe)
--
-- Booking stages:
--   awaiting_payment -> player books. Must pay within 1 hour, or before the
--                       slot starts if sooner. Unpaid = expires, slot reopens.
--   payment_reported -> player tapped "I've paid". The timer stops and the
--                       venue is asked to check.
--   confirmed        -> venue tapped "Payment received". Locked: no refund,
--                       no reposting of that court and time.
--   cancelled        -> player cancelled before paying, or venue said
--                       "Not received", or (emergency) admin cancelled.
--   expired          -> not paid in time.
-- Rules:
--   * Players can cancel free of charge only before they report payment.
--   * If a paid booking is cancelled by the venue/admin, refund_due is set:
--     the venue must refund in full.
--   * One unpaid booking at a time per player. Two expired bookings in the
--     last 7 days blocks new bookings for 7 days.
-- =====================================================================

-- 1. Payment details (only the venue, and players with a booking, can see them)
create table public.venue_payment_details (
  venue_id     uuid primary key references public.venues (id) on delete cascade,
  fps_id       text,
  payme_id     text,
  account_name text not null check (length(trim(account_name)) > 0),
  updated_at   timestamptz not null default now(),
  constraint has_a_method check (coalesce(fps_id, '') <> '' or coalesce(payme_id, '') <> '')
);

alter table public.venue_payment_details enable row level security;

create policy "payment details venue manage" on public.venue_payment_details for all
  using (public.is_venue_admin(venue_id) or public.is_platform_admin())
  with check (public.is_venue_admin(venue_id));

-- 2. Booking stages ---------------------------------------------------------
drop index if exists public.one_active_booking_per_slot;

alter table public.bookings alter column status drop default;
alter table public.bookings alter column status type text using status::text;
alter table public.bookings alter column status set default 'awaiting_payment';
alter table public.bookings
  add constraint booking_status_valid
    check (status in ('awaiting_payment', 'payment_reported', 'confirmed', 'cancelled', 'expired'));

alter table public.bookings
  add column player_email         text,
  add column payment_due_at       timestamptz,
  add column paid_reported_at     timestamptz,
  add column payment_confirmed_at timestamptz,
  add column refund_due           boolean not null default false,
  add column cancel_reason        text;

alter table public.bookings drop constraint if exists bookings_cancelled_by_check;
alter table public.bookings
  add constraint bookings_cancelled_by_check
    check (cancelled_by is null or cancelled_by in ('player', 'venue', 'admin'));

-- Still the double-booking guard: one live booking per slot.
create unique index one_active_booking_per_slot
  on public.bookings (slot_id)
  where (status in ('awaiting_payment', 'payment_reported', 'confirmed'));

-- Marks unpaid bookings past their deadline as expired. Called by every action.
create function public.expire_unpaid_bookings() returns void
language sql security definer set search_path = '' as $$
  update public.bookings
     set status = 'expired'
   where status = 'awaiting_payment' and payment_due_at < now();
$$;

-- 3. Actions ----------------------------------------------------------------
drop function if exists public.book_slot(uuid);
create function public.book_slot(p_slot_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_profile public.profiles;
  v_slot_id uuid;
  v_starts  timestamptz;
  v_venue   uuid;
  v_booking public.bookings;
  v_code    text;
begin
  if auth.uid() is null then
    raise exception 'Please log in to book';
  end if;
  perform public.expire_unpaid_bookings();

  select * into v_profile from public.profiles where id = auth.uid();
  if v_profile.full_name is null or v_profile.phone is null then
    raise exception 'Please add your name and phone number before booking';
  end if;

  if exists (select 1 from public.bookings
             where player_id = auth.uid() and status = 'awaiting_payment') then
    raise exception 'You have a booking waiting for payment. Please pay or cancel it before booking another slot.';
  end if;
  if (select count(*) from public.bookings
      where player_id = auth.uid() and status = 'expired'
        and payment_due_at > now() - interval '7 days') >= 2 then
    raise exception 'Two of your recent bookings expired without payment, so booking is paused for 7 days.';
  end if;

  select s.id, s.starts_at, c.venue_id into v_slot_id, v_starts, v_venue
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.id = p_slot_id and s.status = 'open' and v.status = 'approved' and v.is_claimed
  for update of s;

  if v_slot_id is null then
    raise exception 'This slot is not available';
  end if;
  if v_starts <= now() then
    raise exception 'This slot has already started';
  end if;
  if not exists (select 1 from public.venue_payment_details where venue_id = v_venue) then
    raise exception 'This venue is not taking bookings yet';
  end if;

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  begin
    insert into public.bookings (slot_id, player_id, booking_code, player_name, player_phone,
                                 player_email, status, payment_due_at)
    values (p_slot_id, auth.uid(), v_code, v_profile.full_name, v_profile.phone,
            (select email from auth.users where id = auth.uid()), 'awaiting_payment',
            least(now() + interval '1 hour', v_starts))
    returning * into v_booking;
  exception when unique_violation then
    raise exception 'Sorry, this slot was just booked by someone else';
  end;

  return v_booking;
end $$;

-- Player: "I've paid"
create function public.report_payment(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
begin
  perform public.expire_unpaid_bookings();
  update public.bookings
     set status = 'payment_reported', paid_reported_at = now()
   where id = p_booking_id and player_id = auth.uid() and status = 'awaiting_payment'
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'This booking can''t be marked as paid (it may have expired or been cancelled).';
  end if;
  return v_booking;
end $$;

-- Player: cancel (free) before reporting payment.
drop function if exists public.cancel_booking(uuid);
create function public.cancel_booking(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
begin
  perform public.expire_unpaid_bookings();
  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'player'
   where id = p_booking_id and player_id = auth.uid() and status = 'awaiting_payment'
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'Only unpaid bookings can be cancelled. Paid bookings are non-refundable.';
  end if;
  return v_booking;
end $$;

-- Venue: "Payment received" (also works if the player hasn't tapped "I've paid" yet)
create function public.confirm_payment(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_venue   uuid;
begin
  perform public.expire_unpaid_bookings();
  select c.venue_id into v_venue
  from public.bookings b join public.slots s on s.id = b.slot_id join public.courts c on c.id = s.court_id
  where b.id = p_booking_id;
  if v_venue is null or not public.is_venue_admin(v_venue) then
    raise exception 'Booking not found';
  end if;

  update public.bookings
     set status = 'confirmed', payment_confirmed_at = now()
   where id = p_booking_id and status in ('awaiting_payment', 'payment_reported')
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'This booking is no longer waiting for payment.';
  end if;
  return v_booking;
end $$;

-- Venue: "Not received" -> booking cancelled, slot reopens.
create function public.reject_payment(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_venue   uuid;
begin
  select c.venue_id into v_venue
  from public.bookings b join public.slots s on s.id = b.slot_id join public.courts c on c.id = s.court_id
  where b.id = p_booking_id;
  if v_venue is null or not public.is_venue_admin(v_venue) then
    raise exception 'Booking not found';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'venue',
         cancel_reason = 'Payment not received'
   where id = p_booking_id and status in ('awaiting_payment', 'payment_reported')
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'This booking is no longer waiting for payment.';
  end if;
  return v_booking;
end $$;

-- Slot cancel: venues can only cancel slots with no live booking.
-- Admin (emergency) can cancel anything; a paid booking then owes a full refund.
create or replace function public.cancel_slot(p_slot_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_venue uuid;
begin
  perform public.expire_unpaid_bookings();
  select c.venue_id into v_venue
  from public.slots s join public.courts c on c.id = s.court_id
  where s.id = p_slot_id;

  if v_venue is null or not (public.is_venue_admin(v_venue) or public.is_platform_admin()) then
    raise exception 'Slot not found';
  end if;

  if exists (select 1 from public.bookings b where b.slot_id = p_slot_id
             and b.status in ('awaiting_payment', 'payment_reported', 'confirmed'))
     and not public.is_platform_admin() then
    raise exception 'This slot has been booked, so it can''t be cancelled. Please contact us if there''s an emergency.';
  end if;

  update public.bookings
     set refund_due = (status in ('payment_reported', 'confirmed')),
         status = 'cancelled', cancelled_at = now(), cancelled_by = 'admin',
         cancel_reason = 'Cancelled by venue (emergency)'
   where slot_id = p_slot_id and status in ('awaiting_payment', 'payment_reported', 'confirmed');
  update public.slots set status = 'cancelled' where id = p_slot_id;
end $$;

-- Booked slots can't be edited (any live booking counts now).
create or replace function public.lock_booked_slot() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (new.starts_at, new.ends_at, new.normal_price, new.discounted_price, new.court_id)
     is distinct from
     (old.starts_at, old.ends_at, old.normal_price, old.discounted_price, old.court_id)
     and exists (select 1 from public.bookings b where b.slot_id = old.id
                 and b.status in ('awaiting_payment', 'payment_reported', 'confirmed')) then
    raise exception 'This slot is booked; it can''t be changed';
  end if;
  if new.status = 'cancelled' and old.status = 'open'
     and coalesce(auth.role(), '') in ('anon', 'authenticated')
     and exists (select 1 from public.bookings b where b.slot_id = old.id
                 and b.status in ('awaiting_payment', 'payment_reported', 'confirmed')) then
    raise exception 'Use the cancel slot action';
  end if;
  return new;
end $$;

-- Payment details for a player's own live booking.
create function public.get_booking_payment(p_booking_id uuid)
returns table (fps_id text, payme_id text, account_name text)
language sql stable security definer set search_path = '' as $$
  select p.fps_id, p.payme_id, p.account_name
  from public.bookings b
  join public.slots s on s.id = b.slot_id
  join public.courts c on c.id = s.court_id
  join public.venue_payment_details p on p.venue_id = c.venue_id
  where b.id = p_booking_id and b.player_id = auth.uid()
    and b.status in ('awaiting_payment', 'payment_reported', 'confirmed')
$$;

-- 4. Public slot search: hide slots with a live booking, and venues that
--    haven't set up payment.
drop function if exists public.search_available_slots(public.region, text, text, date, date, time, time);
create function public.search_available_slots(
  p_region     public.region default null,
  p_district   text          default null,
  p_name       text          default null,
  p_from_date  date          default null,
  p_to_date    date          default null,
  p_from_time  time          default null,
  p_to_time    time          default null
)
returns table (
  slot_id          uuid,
  starts_at        timestamptz,
  ends_at          timestamptz,
  normal_price     numeric,
  discounted_price numeric,
  discount_rate    smallint,
  discount_pct     numeric,
  court_name       text,
  venue_id         uuid,
  venue_name       text,
  address          text,
  district         text,
  region           public.region,
  venue_whatsapp   text,
  venue_instagram  text
)
language sql stable security definer set search_path = '' as $$
  select s.id, s.starts_at, s.ends_at, s.normal_price, s.discounted_price, s.discount_rate,
         s.discount_pct, c.name, v.id, v.name, v.address, v.district, v.region, v.whatsapp, v.instagram
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.status = 'open'
    and v.status = 'approved'
    and v.is_claimed
    and s.starts_at > now()
    and exists (select 1 from public.venue_payment_details p where p.venue_id = v.id)
    and not exists (select 1 from public.bookings b where b.slot_id = s.id
                    and (b.status in ('payment_reported', 'confirmed')
                         or (b.status = 'awaiting_payment' and b.payment_due_at >= now())))
    and (p_region   is null or v.region = p_region)
    and (p_district is null or v.district = p_district)
    and (p_name     is null or v.name ilike '%' || p_name || '%'
                            or c.name ilike '%' || p_name || '%')
    and (p_from_date is null or (s.starts_at at time zone 'Asia/Hong_Kong')::date >= p_from_date)
    and (p_to_date   is null or (s.starts_at at time zone 'Asia/Hong_Kong')::date <= p_to_date)
    and (p_from_time is null or (s.starts_at at time zone 'Asia/Hong_Kong')::time >= p_from_time)
    and (p_to_time   is null or (s.starts_at at time zone 'Asia/Hong_Kong')::time <  p_to_time)
  order by s.starts_at
$$;

-- 5. Permissions -----------------------------------------------------------
revoke execute on function public.book_slot(uuid)        from public, anon;
revoke execute on function public.report_payment(uuid)   from public, anon;
revoke execute on function public.cancel_booking(uuid)   from public, anon;
revoke execute on function public.confirm_payment(uuid)  from public, anon;
revoke execute on function public.reject_payment(uuid)   from public, anon;
revoke execute on function public.get_booking_payment(uuid) from public, anon;
revoke execute on function public.expire_unpaid_bookings() from public, anon;
grant  execute on function public.book_slot(uuid)        to authenticated;
grant  execute on function public.report_payment(uuid)   to authenticated;
grant  execute on function public.cancel_booking(uuid)   to authenticated;
grant  execute on function public.confirm_payment(uuid)  to authenticated;
grant  execute on function public.reject_payment(uuid)   to authenticated;
grant  execute on function public.get_booking_payment(uuid) to authenticated;
grant  execute on function public.expire_unpaid_bookings() to authenticated;
grant  execute on function public.search_available_slots(public.region, text, text, date, date, time, time)
  to anon, authenticated;

-- 6. Player pages ------------------------------------------------------------
-- Save the phone number given at sign-up (if it looks valid).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_phone text := new.raw_user_meta_data ->> 'phone';
begin
  if v_phone is not null and v_phone !~ '^\+?[0-9 ]{8,16}$' then
    v_phone := null;
  end if;
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', v_phone);
  return new;
end $$;

-- One slot, for the public slot page (also says whether it's still available).
create function public.get_public_slot(p_slot_id uuid)
returns table (
  slot_id uuid, starts_at timestamptz, ends_at timestamptz, normal_price numeric,
  discounted_price numeric, discount_rate smallint, discount_pct numeric, court_name text,
  venue_id uuid, venue_name text, address text, district text, region public.region,
  venue_whatsapp text, venue_instagram text, opening_hours text, is_available boolean
)
language sql stable security definer set search_path = '' as $$
  select s.id, s.starts_at, s.ends_at, s.normal_price, s.discounted_price, s.discount_rate,
         s.discount_pct, c.name, v.id, v.name, v.address, v.district, v.region, v.whatsapp,
         v.instagram, v.opening_hours,
         s.status = 'open' and s.starts_at > now()
           and exists (select 1 from public.venue_payment_details p where p.venue_id = v.id)
           and not exists (select 1 from public.bookings b where b.slot_id = s.id
                           and (b.status in ('payment_reported', 'confirmed')
                                or (b.status = 'awaiting_payment' and b.payment_due_at >= now())))
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.id = p_slot_id and v.status = 'approved' and v.is_claimed
$$;

-- The logged-in player's bookings with slot and venue details.
create function public.get_my_bookings(p_booking_id uuid default null)
returns table (
  booking_id uuid, booking_code text, status text, payment_due_at timestamptz,
  paid_reported_at timestamptz, payment_confirmed_at timestamptz, cancelled_by text,
  cancel_reason text, refund_due boolean, created_at timestamptz,
  starts_at timestamptz, ends_at timestamptz, normal_price numeric, discounted_price numeric,
  discount_rate smallint, court_name text, venue_id uuid, venue_name text, address text,
  district text, venue_whatsapp text, venue_email text
)
language sql stable security definer set search_path = '' as $$
  select b.id, b.booking_code,
         case when b.status = 'awaiting_payment' and b.payment_due_at < now() then 'expired' else b.status end,
         b.payment_due_at, b.paid_reported_at, b.payment_confirmed_at, b.cancelled_by,
         b.cancel_reason, b.refund_due, b.created_at,
         s.starts_at, s.ends_at, s.normal_price, s.discounted_price, s.discount_rate,
         c.name, v.id, v.name, v.address, v.district, v.whatsapp, v.contact_email
  from public.bookings b
  join public.slots s on s.id = b.slot_id
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where b.player_id = auth.uid() and (p_booking_id is null or b.id = p_booking_id)
  order by s.starts_at desc
$$;

grant execute on function public.get_public_slot(uuid) to anon, authenticated;
revoke execute on function public.get_my_bookings(uuid) from public, anon;
grant execute on function public.get_my_bookings(uuid) to authenticated;
