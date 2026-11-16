-- =====================================================================
-- Safeguards against double booking with a venue's other channels
--
--   * Booking closes 30 minutes before a slot starts (and slots can't be
--     posted to start within 30 minutes).
--   * "Payment received" requires the venue to confirm they've blocked
--     the court in their own system (recorded on the booking).
--   * "Court not available": the venue can cancel a clashed booking. If
--     the player had paid, a full refund is due. That court and time
--     can't be posted again afterwards.
--   * Daily summary data for the morning email (server use only).
-- =====================================================================

-- 1. 30-minute cut-off ---------------------------------------------------
create or replace function public.slot_must_be_future() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.starts_at <= now() + interval '30 minutes' then
    raise exception 'Slots must start at least 30 minutes from now';
  end if;
  return new;
end $$;

create or replace function public.book_slot(p_slot_id uuid) returns public.bookings
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
  if v_starts <= now() + interval '30 minutes' then
    raise exception 'Booking closes 30 minutes before the start';
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

create or replace function public.search_available_slots(
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
    and s.starts_at > now() + interval '30 minutes'
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

create or replace function public.get_public_slot(p_slot_id uuid)
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
         s.status = 'open' and s.starts_at > now() + interval '30 minutes'
           and exists (select 1 from public.venue_payment_details p where p.venue_id = v.id)
           and not exists (select 1 from public.bookings b where b.slot_id = s.id
                           and (b.status in ('payment_reported', 'confirmed')
                                or (b.status = 'awaiting_payment' and b.payment_due_at >= now())))
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  where s.id = p_slot_id and v.status = 'approved' and v.is_claimed
$$;

-- 2. "I've blocked this court" on payment confirmation --------------------
alter table public.bookings add column court_blocked_confirmed_at timestamptz;

drop function if exists public.confirm_payment(uuid);
create function public.confirm_payment(p_booking_id uuid, p_court_blocked boolean)
returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_venue   uuid;
begin
  if not coalesce(p_court_blocked, false) then
    raise exception 'Please confirm you''ve blocked this court in your own booking system.';
  end if;
  perform public.expire_unpaid_bookings();
  select c.venue_id into v_venue
  from public.bookings b join public.slots s on s.id = b.slot_id join public.courts c on c.id = s.court_id
  where b.id = p_booking_id;
  if v_venue is null or not public.is_venue_admin(v_venue) then
    raise exception 'Booking not found';
  end if;

  update public.bookings
     set status = 'confirmed', payment_confirmed_at = now(), court_blocked_confirmed_at = now()
   where id = p_booking_id and status in ('awaiting_payment', 'payment_reported')
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'This booking is no longer waiting for payment.';
  end if;
  return v_booking;
end $$;

-- 3. "Court not available" ---------------------------------------------------
create function public.mark_court_unavailable(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_booking public.bookings;
  v_venue   uuid;
  v_slot    uuid;
begin
  perform public.expire_unpaid_bookings();
  select c.venue_id, b.slot_id into v_venue, v_slot
  from public.bookings b join public.slots s on s.id = b.slot_id join public.courts c on c.id = s.court_id
  where b.id = p_booking_id;
  if v_venue is null or not (public.is_venue_admin(v_venue) or public.is_platform_admin()) then
    raise exception 'Booking not found';
  end if;

  update public.bookings
     set refund_due = (status in ('payment_reported', 'confirmed')),
         status = 'cancelled', cancelled_at = now(), cancelled_by = 'venue',
         cancel_reason = 'Court not available'
   where id = p_booking_id and status in ('awaiting_payment', 'payment_reported', 'confirmed')
  returning * into v_booking;
  if v_booking.id is null then
    raise exception 'This booking is not active.';
  end if;

  -- The court is taken, so the slot is withdrawn (not reopened).
  update public.slots set status = 'cancelled' where id = v_slot;
  return v_booking;
end $$;

-- A court/time marked unavailable on a booking can't be posted again.
create function public.block_repost_of_unavailable() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (
    select 1 from public.slots s
    join public.bookings b on b.slot_id = s.id
    where s.court_id = new.court_id
      and b.cancel_reason = 'Court not available'
      and tstzrange(s.starts_at, s.ends_at) && tstzrange(new.starts_at, new.ends_at)
  ) then
    raise exception 'This court and time was marked not available for a booking, so it can''t be posted again.';
  end if;
  return new;
end $$;

create trigger slots_block_repost_of_unavailable
  before insert on public.slots
  for each row execute function public.block_repost_of_unavailable();

-- The direct slot-cancel trigger and cancel_slot only allow this path now.
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
    raise exception 'Use "Court not available" for a booked slot';
  end if;
  return new;
end $$;

-- 4. Morning summary (called by the server with the service key only) -------
create function public.daily_venue_summaries(p_date date)
returns table (
  venue_id uuid, venue_name text, contact_email text,
  court_name text, starts_at timestamptz, ends_at timestamptz,
  discounted_price numeric, booking_status text, booking_code text,
  player_name text, player_phone text
)
language sql stable security definer set search_path = '' as $$
  select v.id, v.name, v.contact_email, c.name, s.starts_at, s.ends_at, s.discounted_price,
         case when b.status = 'awaiting_payment' and b.payment_due_at < now() then null else b.status end,
         b.booking_code, b.player_name, b.player_phone
  from public.slots s
  join public.courts c on c.id = s.court_id
  join public.venues v on v.id = c.venue_id
  left join public.bookings b on b.slot_id = s.id
       and b.status in ('awaiting_payment', 'payment_reported', 'confirmed')
  where s.status = 'open'
    and v.is_claimed and v.status = 'approved' and v.contact_email is not null
    and (s.starts_at at time zone 'Asia/Hong_Kong')::date = p_date
  order by v.id, s.starts_at, c.name
$$;

-- 5. Permissions -------------------------------------------------------------
revoke execute on function public.confirm_payment(uuid, boolean) from public, anon;
grant  execute on function public.confirm_payment(uuid, boolean) to authenticated;
revoke execute on function public.mark_court_unavailable(uuid) from public, anon;
grant  execute on function public.mark_court_unavailable(uuid) to authenticated;
revoke execute on function public.daily_venue_summaries(date) from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    execute 'grant execute on function public.daily_venue_summaries(date) to service_role';
  end if;
end $$;
