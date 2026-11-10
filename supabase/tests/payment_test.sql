-- Run after rules/claims/pricing tests and the payment-flow migration.
\set QUIET on
create or replace function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('request.jwt.claim.role', case when u='' then 'anon' else 'authenticated' end, false) $$;
-- fresh slots at the claimed+approved venue "Tsuen Wan Pickle" (owner b1)
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate)
select c.id, now()+interval '10 days'+(n||' hours')::interval, now()+interval '10 days'+((n+1)||' hours')::interval, 200, 150, 25
from courts c join venues v on v.id=c.venue_id, generate_series(1,4) n where v.name='Tsuen Wan Pickle' and c.name='Court 1';
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate)
select c.id, now()+interval '30 minutes', now()+interval '90 minutes', 200, 150, 25 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' and c.name='Court 1';
reset role;
select id as a from slots where starts_at > now()+interval '10 days' order by starts_at limit 1 offset 0 \gset
select id as b from slots where starts_at > now()+interval '10 days' order by starts_at limit 1 offset 1 \gset
select id as d from slots where starts_at > now()+interval '10 days' order by starts_at limit 1 offset 2 \gset
select id as e from slots where starts_at > now()+interval '10 days' order by starts_at limit 1 offset 3 \gset
select id as soon from slots where starts_at < now()+interval '1 hour' and status='open' limit 1 \gset
\set QUIET off
\echo '== F1. booking blocked until the venue sets up payment'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select book_slot(:'a');
select count(*) as visible_in_search from search_available_slots();
\echo '== F2. owner adds payment details; empty one rejected; another owner cannot see them'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into venue_payment_details (venue_id, fps_id, payme_id, account_name) select id, '', '', 'X' from venues where name='Tsuen Wan Pickle';
insert into venue_payment_details (venue_id, fps_id, account_name) select id, '1234567', 'Tsuen Wan Pickle Ltd' from venues where name='Tsuen Wan Pickle' returning fps_id, account_name;
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3'); set role authenticated;
select count(*) as other_owner_sees from venue_payment_details;
reset role; select pg_temp.as_user(''); set role anon;
select count(*) as visible_in_search_anon from search_available_slots();
\echo '== F3. p1 books A: awaiting payment, due in ~1h; second booking blocked while unpaid'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select status, round(extract(epoch from payment_due_at - now())/60) as due_in_min, player_email from book_slot(:'a');
select book_slot(:'b');
select fps_id, account_name from get_booking_payment((select id from bookings where slot_id=:'a' and status='awaiting_payment'));
\echo '== F4. p2 cannot book A, cannot see p1 payment info, cannot report/cancel p1 booking'
reset role; select id as bk from bookings where slot_id=:'a' and status='awaiting_payment' \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2'); set role authenticated;
select book_slot(:'a');
select count(*) as p2_sees_payment from get_booking_payment(:'bk');
select report_payment(:'bk');
select cancel_booking(:'bk');
\echo '== F5. p1 cancels (free) -> slot back in search'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select status, cancelled_by from cancel_booking(:'bk');
select count(*) filter (where slot_id = :'a') as a_back_in_search from search_available_slots();
\echo '== F6. p1 books A again, reports paid; can no longer cancel'
select status from book_slot(:'a');
reset role; select id as bk2 from bookings where slot_id=:'a' and status='awaiting_payment' \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select status, paid_reported_at is not null as reported from report_payment(:'bk2');
select cancel_booking(:'bk2');
\echo '== F7. venue confirms; then cannot cancel slot or repost same court/time'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
select status, payment_confirmed_at is not null as confirmed from confirm_payment(:'bk2');
select cancel_slot(:'a');
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select court_id, starts_at, ends_at, 200, 150, 25 from slots where id=:'a';
\echo '== F8. p1 books B; venue says not received -> cancelled, B reopens'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select status from book_slot(:'b');
reset role; select id as bk3 from bookings where slot_id=:'b' and status='awaiting_payment' \gset
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3'); set role authenticated;
select reject_payment(:'bk3');
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
select status, cancel_reason from reject_payment(:'bk3');
select count(*) filter (where slot_id = :'b') as b_back_in_search from search_available_slots();
\echo '== F9. slot starting in 30 min: deadline = start time'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2'); set role authenticated;
select round(extract(epoch from payment_due_at - now())/60) as due_in_min from book_slot(:'soon');
\echo '== F10. expiry: deadline passes -> expired + slot reopens; 2 expiries -> 7-day block'
reset role; update bookings set payment_due_at = now() - interval '1 minute' where slot_id=:'soon';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2'); set role authenticated;
select count(*) filter (where slot_id = :'soon') as soon_back_in_search from search_available_slots();
select status from book_slot(:'d');
reset role; update bookings set payment_due_at = now() - interval '1 minute' where slot_id=:'d' and status='awaiting_payment';
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2'); set role authenticated;
select book_slot(:'e');
select status, count(*) from bookings group by status order by 1;
\echo '== F11. admin emergency-cancels the paid slot A -> refund due'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); set role authenticated;
select cancel_slot(:'a');
reset role;
select status, cancelled_by, refund_due, cancel_reason from bookings where id = :'bk2';
