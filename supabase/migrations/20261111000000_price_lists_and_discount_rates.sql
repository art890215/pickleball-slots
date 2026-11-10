-- =====================================================================
-- Price lists and fixed discount rates
--
--   * Discount is now chosen from 20%, 25%, 30%, 35% or 40% (was 20-30%).
--     The discounted price is worked out from the original price.
--   * Each venue keeps a price list: days of the week + time range +
--     price per hour. Slots take their original price from it.
--   * Owners can no longer cancel a slot that a player has booked.
--     It only opens up again if the player cancels.
-- =====================================================================

-- 1. Discount rates ----------------------------------------------------
alter table public.slots drop constraint discount_in_band;

alter table public.slots
  add column discount_rate smallint,
  add constraint discount_in_band
    check (discounted_price between normal_price * 0.60 and normal_price * 0.80),
  add constraint discount_rate_allowed
    check (discount_rate is null or discount_rate in (20, 25, 30, 35, 40)),
  add constraint discounted_price_matches_rate
    check (discount_rate is null
           or discounted_price = round(normal_price * (100 - discount_rate) / 100.0));

-- 2. Price lists -------------------------------------------------------
create table public.venue_price_rules (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references public.venues (id) on delete cascade,
  days           smallint[] not null,         -- 0 = Sunday ... 6 = Saturday
  start_time     time not null,
  end_time       time not null,               -- earlier than start = runs past midnight
  price_per_hour numeric(10, 2) not null check (price_per_hour > 0),
  created_at     timestamptz not null default now(),
  constraint days_valid check (
    cardinality(days) between 1 and 7 and days <@ array[0,1,2,3,4,5,6]::smallint[]
  ),
  constraint times_differ check (start_time <> end_time)
);

create index venue_price_rules_venue_idx on public.venue_price_rules (venue_id);

alter table public.venue_price_rules enable row level security;

create policy "price rules public read" on public.venue_price_rules for select
  using (public.is_venue_admin(venue_id) or public.is_platform_admin()
         or exists (select 1 from public.venues v where v.id = venue_id and v.status = 'approved'));
create policy "price rules insert" on public.venue_price_rules for insert
  with check (public.is_venue_admin(venue_id));
create policy "price rules update" on public.venue_price_rules for update
  using (public.is_venue_admin(venue_id)) with check (public.is_venue_admin(venue_id));
create policy "price rules delete" on public.venue_price_rules for delete
  using (public.is_venue_admin(venue_id));

-- 3. Owners can't cancel a booked slot ---------------------------------
create or replace function public.cancel_slot(p_slot_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_venue uuid;
begin
  select c.venue_id into v_venue
  from public.slots s join public.courts c on c.id = s.court_id
  where s.id = p_slot_id;

  if v_venue is null or not (public.is_venue_admin(v_venue) or public.is_platform_admin()) then
    raise exception 'Slot not found';
  end if;

  if exists (select 1 from public.bookings b where b.slot_id = p_slot_id and b.status = 'confirmed')
     and not public.is_platform_admin() then
    raise exception 'This slot has been booked, so it can''t be cancelled. Please contact us if there''s an emergency.';
  end if;

  update public.bookings
     set status = 'cancelled', cancelled_at = now(), cancelled_by = 'venue'
   where slot_id = p_slot_id and status = 'confirmed';
  update public.slots set status = 'cancelled' where id = p_slot_id;
end $$;

-- 4. Courts can only be removed if they have never had a slot -----------
create or replace function public.protect_court_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.slots where court_id = old.id) then
    raise exception 'This court has slots, so it can''t be removed. You can rename it instead.';
  end if;
  return old;
end $$;

create trigger courts_protect_delete
  before delete on public.courts
  for each row execute function public.protect_court_delete();
