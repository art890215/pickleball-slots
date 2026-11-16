-- Run after payment_test.sql.
\set QUIET on
create or replace function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('request.jwt.claim.role', case when u='' then 'anon' else 'authenticated' end, false) $$;
insert into auth.users values ('00000000-0000-0000-0000-0000000000f1','f1@x','{"full_name":"Fiona","phone":"+852 98887777"}');
\set QUIET off
\echo '== S1. venue cannot post a slot starting within 30 minutes'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '20 minutes', now()+interval '80 minutes', 200, 150, 25 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' and c.name='Court 1';
\echo '== S2. slot reaching the 30-min cut-off disappears and cannot be booked'
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '12 days', now()+interval '12 days 1 hour', 200, 150, 25 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' and c.name='Court 1';
reset role;
select id as late from slots where starts_at > now()+interval '11 days 23 hours' and starts_at < now()+interval '12 days 1 minute' \gset
alter table slots disable trigger slots_future_on_retime;
update slots set starts_at = now()+interval '15 minutes', ends_at = now()+interval '40 minutes' where id = :'late';
alter table slots enable trigger slots_future_on_retime;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1'); set role authenticated;
select count(*) filter (where slot_id = :'late') as late_in_search from search_available_slots();
select is_available from get_public_slot(:'late');
select book_slot(:'late');
\echo '== S3. Payment received needs the blocked-court tick'
reset role;
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '13 days', now()+interval '13 days 1 hour', 200, 150, 25 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' and c.name='Court 1';
reset role; select id as x from slots where starts_at > now()+interval '12 days 23 hours' and starts_at < now()+interval '13 days 1 minute' \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000000f1'); set role authenticated;
select status from book_slot(:'x');
reset role; select id as bx from bookings where slot_id = :'x' and status='awaiting_payment' \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
select confirm_payment(:'bx', false);
select status, court_blocked_confirmed_at is not null as blocked_recorded from confirm_payment(:'bx', true);
\echo '== S4. clash: venue marks paid booking "court not available" -> refund due, slot withdrawn, no repost'
select status, refund_due, cancel_reason from mark_court_unavailable(:'bx');
reset role; select status as slot_status from slots where id = :'x'; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select court_id, starts_at, ends_at, 200, 150, 25 from slots where id = :'x';
\echo '== S5. another venue owner cannot mark it; daily summary not callable by users'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3'); set role authenticated;
select mark_court_unavailable(:'bx');
select * from daily_venue_summaries(current_date);
\echo '== S6. daily summary works for the server'
reset role;
select venue_name, court_name, booking_status from daily_venue_summaries(((now() + interval '10 days') at time zone 'Asia/Hong_Kong')::date) limit 4;
