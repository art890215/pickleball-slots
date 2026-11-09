-- Run after rules_test.sql (reuses its users).
\set QUIET on
create or replace function pg_temp.as_user(u text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', u, false), set_config('request.jwt.claim.role', case when u='' then 'anon' else 'authenticated' end, false) $$;
insert into auth.users values ('00000000-0000-0000-0000-0000000000d1','newowner@x','{"full_name":"New Owner"}'),
                              ('00000000-0000-0000-0000-0000000000d2','sneaky@x','{"full_name":"Sneaky"}');
\set QUIET off
\echo '== C1. import an unclaimed venue as the database owner (like the SQL editor), no WhatsApp/owner'
reset role; select pg_temp.as_user('');  reset role;
select set_config('request.jwt.claim.role','',false) \g /dev/null
insert into venues (name,address,district,status,is_claimed,opening_hours,instagram) values ('Imported Pickle','9 Rd','Kwun Tong','approved',false,'Open 24 hours','imported.pickle') returning name, region, status, is_claimed, created_by;
select count(*) as admins_for_imported from venue_admins va join venues v on v.id=va.venue_id where v.name='Imported Pickle';
\echo '== C2. visitor sees it in the public list (approved)'
select pg_temp.as_user(''); set role anon;
select name, is_claimed from venues where name='Imported Pickle';
\echo '== C3. visitor cannot read claim links'
select count(*) as claims_visible from venue_claims;
\echo '== C4. platform admin creates a claim link'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); set role authenticated;
insert into venue_claims (venue_id) select id from venues where name='Imported Pickle' returning length(token) as token_len;
reset role;
select token as tok from venue_claims limit 1 \gset
\echo '== C5. anyone with the link can preview the venue'
select pg_temp.as_user(''); set role anon;
select name, already_used from get_claim(:'tok');
select name from get_claim('wrong-token');
\echo '== C6. visitor (not logged in) cannot claim'
select claim_venue(:'tok','X','Owner','+852 91234567','+852 91234567','x','x@y.com');
\echo '== C7. owner with an existing venue cannot flip is_claimed on their own venue'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000b1'); set role authenticated;
update venues set is_claimed = false where name='Tsuen Wan Pickle';
\echo '== C8. new owner claims with a wrong token, then the right one'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d1'); set role authenticated;
select claim_venue('nope','New Owner','Manager','+852 91112222','+852 93334444','imported.pickle','hi@imported.hk');
select claim_venue(:'tok','New Owner','Manager','+852 91112222','+852 93334444','imported.pickle','hi@imported.hk') is not null as claimed;
select name, status, is_claimed, whatsapp, contact_email, applicant_title from venues where name='Imported Pickle';
select count(*) as my_venues from venue_admins where user_id = auth.uid();
\echo '== C9. new owner can add a slot to their claimed venue'
insert into slots (court_id,starts_at,ends_at,normal_price,discounted_price) select c.id, now()+interval '2 days', now()+interval '2 days 1 hour', 200, 150 from courts c join venues v on v.id=c.venue_id where v.name='Imported Pickle' returning discount_pct;
\echo '== C10. someone else tries the same link again (expect: already claimed)'
reset role; select pg_temp.as_user('00000000-0000-0000-0000-0000000000d2'); set role authenticated;
select claim_venue(:'tok','Sneaky','Owner','+852 95556666','+852 95556666','sneaky','s@x.com');
select name, already_used from get_claim(:'tok');
\echo '== C11. normal owner application still requires Instagram/email/title'
insert into venues (name,address,district,whatsapp) values ('No details','1 St','Wan Chai','+852 91234567');
