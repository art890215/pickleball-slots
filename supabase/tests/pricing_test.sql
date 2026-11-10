-- Run after rules_test.sql (reuses its users and venue).
\set QUIET on
create or replace function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('request.jwt.claim.role', case when u='' then 'anon' else 'authenticated' end, false) $$;
\set QUIET off
\echo '== P1. owner adds price rules (weekdays morning, weekend overnight)'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into venue_price_rules (venue_id, days, start_time, end_time, price_per_hour)
select id, '{1,2,3,4,5}', '09:00', '12:00', 250 from venues where name='Tsuen Wan Pickle';
insert into venue_price_rules (venue_id, days, start_time, end_time, price_per_hour)
select id, '{0,6}', '23:00', '05:00', 200 from venues where name='Tsuen Wan Pickle';
select days, start_time, end_time, price_per_hour from venue_price_rules order by start_time;
\echo '== P2. bad rules rejected: day 7, same start/end, zero price'
insert into venue_price_rules (venue_id, days, start_time, end_time, price_per_hour) select id, '{7}', '09:00', '10:00', 100 from venues where name='Tsuen Wan Pickle';
insert into venue_price_rules (venue_id, days, start_time, end_time, price_per_hour) select id, '{1}', '09:00', '09:00', 100 from venues where name='Tsuen Wan Pickle';
insert into venue_price_rules (venue_id, days, start_time, end_time, price_per_hour) select id, '{1}', '09:00', '10:00', 0 from venues where name='Tsuen Wan Pickle';
\echo '== P3. another venue owner cannot add rules to this venue'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3'); set role authenticated;
insert into venue_price_rules (venue_id, days, start_time, end_time, price_per_hour) select id, '{1}', '13:00', '14:00', 100 from venues where name='Tsuen Wan Pickle';
\echo '== P4. slots with discount rates: 35% ok, 40% ok, 15% rate rejected, wrong price for rate rejected'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '5 days', now()+interval '5 days 1 hour', 250, 163, 35 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' limit 1 returning discount_rate, discounted_price, discount_pct;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '6 days', now()+interval '6 days 1 hour', 375, 225, 40 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' limit 1 returning discount_rate, discounted_price, discount_pct;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '7 days', now()+interval '7 days 1 hour', 200, 170, 15 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' limit 1;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price,discount_rate) select c.id, now()+interval '8 days', now()+interval '8 days 1 hour', 200, 150, 30 from courts c join venues v on v.id=c.venue_id where v.name='Tsuen Wan Pickle' limit 1;
\echo '== P5. owner can remove an empty court but not one with slots'
insert into courts (venue_id, name) select id, 'Court 9' from venues where name='Tsuen Wan Pickle';
delete from courts where name='Court 9' returning name;
delete from courts c using venues v where v.id=c.venue_id and v.name='Tsuen Wan Pickle' and c.name='Court 1';
