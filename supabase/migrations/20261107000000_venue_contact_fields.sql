-- =====================================================================
-- Venue application: extra required details
--   * Venue Instagram account
--   * Venue contact email
--   * Applicant's job title (e.g. Owner, Manager)
-- Required for every NEW venue. Venues submitted before this change are
-- left as they are.
-- =====================================================================

alter table public.venues
  add column instagram       text,
  add column contact_email   text,
  add column applicant_title text;

alter table public.venues
  add constraint instagram_format
    check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  add constraint contact_email_format
    check (contact_email is null or contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint applicant_title_not_blank
    check (applicant_title is null or length(trim(applicant_title)) > 0);

create function public.venue_require_contact_details() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.instagram is null or new.contact_email is null or new.applicant_title is null then
    raise exception 'Instagram account, contact email and applicant title are required';
  end if;
  return new;
end $$;

create trigger venues_require_contact_details
  before insert on public.venues
  for each row execute function public.venue_require_contact_details();
