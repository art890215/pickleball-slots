-- =====================================================================
-- Unclaimed listings and claim links
--
--   * We can list venues ourselves before the owner joins ("unclaimed").
--     They show in the public directory but take no bookings.
--   * Each unclaimed venue can get a private claim link. The owner opens
--     it, creates an account, and the venue becomes theirs (approved).
--   * New venue details: opening hours and website.
-- =====================================================================

alter table public.venues
  add column is_claimed    boolean not null default true,
  add column opening_hours text,
  add column website       text;

-- Unclaimed venues have no owner yet, and may not have a WhatsApp number.
alter table public.venues
  alter column created_by drop not null,
  alter column whatsapp   drop not null;

alter table public.venues
  add constraint claimed_venue_has_owner
    check (not is_claimed or created_by is not null) not valid,
  add constraint claimed_venue_has_whatsapp
    check (not is_claimed or whatsapp is not null) not valid;

-- Required details only apply to venues submitted by owners.
create or replace function public.venue_require_contact_details() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.is_claimed and (new.instagram is null or new.contact_email is null
                         or new.applicant_title is null) then
    raise exception 'Instagram account, contact email and applicant title are required';
  end if;
  return new;
end $$;

-- An imported venue has no owner, so only add an admin when there is one.
create or replace function public.venue_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null then
    insert into public.venue_admins (venue_id, user_id) values (new.id, new.created_by);
  end if;
  insert into public.courts (venue_id, name) values (new.id, 'Court 1');
  return new;
end $$;

-- Owners can't flip the claimed flag themselves; the claim action does it.
create or replace function public.protect_venue_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated')
     and not public.is_platform_admin()
     and coalesce(current_setting('app.claiming', true), '') <> 'on' then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.approved_at := null;
      new.created_by := auth.uid();
      new.is_claimed := true;
    elsif new.status is distinct from old.status
       or new.approved_at is distinct from old.approved_at
       or new.created_by is distinct from old.created_by
       or new.is_claimed is distinct from old.is_claimed then
      raise exception 'Only a platform admin can change venue approval';
    end if;
  end if;
  if tg_op = 'UPDATE' and new.status = 'approved' and old.status <> 'approved' then
    new.approved_at := now();
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Claim links (one per venue). Only the platform admin can see them.
-- ---------------------------------------------------------------------
create table public.venue_claims (
  venue_id   uuid primary key references public.venues (id) on delete cascade,
  token      text not null unique default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  used_at    timestamptz,
  used_by    uuid references public.profiles (id)
);

alter table public.venue_claims enable row level security;

create policy "claims admin only" on public.venue_claims for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Show which venue a claim link is for (works before logging in).
create function public.get_claim(p_token text)
returns table (venue_id uuid, name text, address text, district text, region public.region,
               whatsapp text, instagram text, contact_email text, already_used boolean)
language sql stable security definer set search_path = '' as $$
  select v.id, v.name, v.address, v.district, v.region, v.whatsapp, v.instagram,
         v.contact_email, (c.used_at is not null or v.is_claimed)
  from public.venue_claims c join public.venues v on v.id = c.venue_id
  where c.token = p_token
$$;

-- Claim the venue: it becomes the logged-in person's, approved straight away.
create function public.claim_venue(
  p_token           text,
  p_full_name       text,
  p_applicant_title text,
  p_phone           text,
  p_whatsapp        text,
  p_instagram       text,
  p_contact_email   text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_claim public.venue_claims;
begin
  if auth.uid() is null then
    raise exception 'Please log in first';
  end if;

  select * into v_claim from public.venue_claims where token = p_token for update;
  if not found then
    raise exception 'This claim link is not valid';
  end if;
  if v_claim.used_at is not null
     or (select is_claimed from public.venues where id = v_claim.venue_id) then
    raise exception 'This venue has already been claimed';
  end if;

  update public.profiles
     set full_name = p_full_name, phone = p_phone
   where id = auth.uid();

  perform set_config('app.claiming', 'on', true);
  update public.venues
     set is_claimed      = true,
         created_by      = auth.uid(),
         status          = 'approved',
         whatsapp        = p_whatsapp,
         instagram       = p_instagram,
         contact_email   = p_contact_email,
         applicant_title = p_applicant_title
   where id = v_claim.venue_id;
  perform set_config('app.claiming', 'off', true);

  insert into public.venue_admins (venue_id, user_id) values (v_claim.venue_id, auth.uid())
  on conflict do nothing;

  update public.venue_claims set used_at = now(), used_by = auth.uid()
   where venue_id = v_claim.venue_id;

  return v_claim.venue_id;
end $$;

revoke execute on function public.claim_venue(text, text, text, text, text, text, text) from public, anon;
grant  execute on function public.claim_venue(text, text, text, text, text, text, text) to authenticated;
grant  execute on function public.get_claim(text) to anon, authenticated;
