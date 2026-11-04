\set QUIET on
-- users (as superuser, simulating sign-ups)
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a','admin@x','{"full_name":"Admin"}'),
 ('00000000-0000-0000-0000-0000000000b1','owner1@x','{"full_name":"Owner One"}'),
 ('00000000-0000-0000-0000-0000000000b2','owner2@x','{"full_name":"Owner Two"}'),
 ('00000000-0000-0000-0000-0000000000b3','owner3@x','{"full_name":"Owner Three"}'),
 ('00000000-0000-0000-0000-0000000000c1','p1@x','{"full_name":"Player One"}'),
 ('00000000-0000-0000-0000-0000000000c2','p2@x','{"full_name":"Player Two"}');
update profiles set is_platform_admin = true where id='00000000-0000-0000-0000-00000000000a';
create or replace function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('request.jwt.claim.role', case when u='' then 'anon' else 'authenticated' end, false) $$;
\set QUIET off
\echo '== 1. player tries to make self admin (expect error)'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
update profiles set is_platform_admin = true where id = auth.uid();
\echo '== 2. owner1 applies with venue, tries to self-approve'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1');
insert into venues (name,address,district,whatsapp,status) values ('Tsuen Wan Pickle','1 Main St','Tsuen Wan','+852 9123 4567','approved') returning name, region, status;
update venues set status='approved';
select name from courts;
\echo '== 3. owner3 applies with a different venue; cannot see owner1 venue'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3');
insert into venues (name,address,district,whatsapp) values ('KT Courts','2 Rd','Kwun Tong','+852 9000 0000');
select name from venues;
\echo '== 4. platform admin approves owner1 venue and adds owner2 as 2nd admin, then tries a 3rd'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); set role authenticated;
update venues set status='approved' where name='Tsuen Wan Pickle' returning status, approved_at is not null as stamped;
insert into venue_admins select id,'00000000-0000-0000-0000-0000000000b2' from venues where name='Tsuen Wan Pickle';
insert into venue_admins select id,'00000000-0000-0000-0000-0000000000b3' from venues where name='Tsuen Wan Pickle';
\echo '== 5. owner2 adds slots: good (25%), too small (10%), too big (40%), overlapping, past'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b2');
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select id, now()+interval '1 day', now()+interval '1 day 1 hour', 200, 150 from courts limit 1 returning discount_pct;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select id, now()+interval '2 day', now()+interval '2 day 1 hour', 200, 180 from courts limit 1;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select id, now()+interval '2 day', now()+interval '2 day 1 hour', 200, 120 from courts limit 1;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select id, now()+interval '1 day 30 min', now()+interval '1 day 90 min', 200, 150 from courts limit 1;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select id, now()-interval '1 hour', now(), 200, 150 from courts limit 1;
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select id, now()+interval '3 hours', now()+interval '4 hours', 100, 75 from courts limit 1;
\echo '== 6. owner3 (other venue) cannot see or add slots at owner1 venue'
select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3');
select count(*) as slots_visible from slots;
\echo '== 7. anonymous visitor sees available slots (expect 2)'
reset role; select pg_temp.as_user(''); set role anon;
select venue_name, court_name, discount_pct from search_available_slots(p_region => 'New Territories');
select count(*) as anon_bookings_visible from bookings;
select book_slot((select slot_id from search_available_slots() limit 1));
\echo '== 8. player1 without phone tries to book (expect error), then adds phone and books'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select book_slot((select slot_id from search_available_slots() order by starts_at desc limit 1));
update profiles set phone='+852 6111 2222' where id=auth.uid();
select status, length(booking_code) code_len, player_name from book_slot((select slot_id from search_available_slots() order by starts_at desc limit 1));
\echo '== 9. player2 tries to book the same slot directly (expect error)'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2'); set role authenticated;
update profiles set phone='+852 6333 4444' where id=auth.uid();
select book_slot((select s.id from slots s) );
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c2'); set role authenticated;
select book_slot(b.slot_id) from (select slot_id from bookings) b;
insert into bookings (slot_id, player_id, booking_code, player_name, player_phone) values (gen_random_uuid(), auth.uid(),'X','x','x');
\echo '== 10. booked slot is hidden from browse (expect 1 left); player2 sees no bookings'
select count(*) available from search_available_slots();
select count(*) p2_sees from bookings;
\echo '== 11. player2 books the 3-hours-away slot, then cancels (expect: too late, < 4h)'
select status from book_slot((select slot_id from search_available_slots() limit 1));
select cancel_booking((select id from bookings limit 1));
\echo '== 12. player1 cancels the tomorrow slot (expect ok), slot reappears'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000c1'); set role authenticated;
select status, cancelled_by from cancel_booking((select id from bookings where status='confirmed' limit 1));
select count(*) available from search_available_slots();
\echo '== 13. owner1 sees both bookings; owner edits booked slot price (expect error); cancels slot via action'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
select player_name, status from bookings order by created_at;
update slots set discounted_price = 70 where id = (select slot_id from bookings where status='confirmed');
select cancel_slot((select slot_id from bookings where status='confirmed'));
select player_name, status, cancelled_by from bookings order by created_at;
\echo '== 14. owner3 cannot cancel or mark attendance at owner1 venue'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b3'); set role authenticated;
select cancel_slot((select id from slots limit 1));
