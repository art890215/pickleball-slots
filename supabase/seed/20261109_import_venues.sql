-- Imported venue listings (unclaimed). Generated from docs/venues/hk_pickleball_courts_researched.xlsx
-- Venues flagged 'Please Check' are imported as 'pending' (hidden) until you check and approve them.
-- Safe to run more than once: venues that already exist (same name) are skipped.

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'The Apex Pickleball HK', 'City Industrial Complex, 116 Kwok Shui Road, Kwai Chung, New Territories, Hong Kong', 'Kwai Tsing', '+852 4447 6542', 'the_apex_pickleball_hk', null, '24/7 Open', 'https://theapex.hk', 'approved', false
where not exists (select 1 from public.venues where name = 'The Apex Pickleball HK');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Yama Pickleball Arena', '黃竹坑業勤街39號 Landmark South 9樓', 'Southern', '+852 9856 0168', null, null, '10:00 - 23:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Yama Pickleball Arena');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Bay Pickle (Tseung Kwan O)', 'G/F Atrium, MCP New Town Plaza Phase 3, Po Lam, Tseung Kwan O', 'Sai Kung', '+852 5702 8701', null, null, 'Daily 09:00 - 22:00', 'https://thebaypickle.com/tseung-kwan-o-1', 'approved', false
where not exists (select 1 from public.venues where name = 'Bay Pickle (Tseung Kwan O)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Lit Pickle', 'Unit A, 15/F, MG Tower, 133 Hoi Bun Road, Kwun Tong', 'Kwun Tong', '+852 6479 5850', null, null, '24/7 Open', 'https://www.litpicklehk.com/', 'approved', false
where not exists (select 1 from public.venues where name = 'Lit Pickle');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickleland', 'Room 2501, Cable TV Tower, 9 Hoi Shing Road, Tsuen Wan', 'Tsuen Wan', '+852 9686 8540', 'picklelandhk', 'contact@picklelandhk.com', 'Open 24 hours', 'https://picklelandhk.com', 'pending', false
where not exists (select 1 from public.venues where name = 'Pickleland');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'K11 MUSEA Pickleball Fest', '18 Salisbury Road, Tsim Sha Tsui', 'Yau Tsim Mong', null, null, null, null, null, 'pending', false
where not exists (select 1 from public.venues where name = 'K11 MUSEA Pickleball Fest');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Smashy Club Pickleball', '土瓜灣新碼頭街38號翔龍灣廣場G34A鋪', 'Kowloon City', '+852 6349 5287', null, null, '10:00 - 22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Smashy Club Pickleball');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Landmark North', '5/F Sky Garden, Landmark North, 39 Lung Sum Avenue, Sheung Shui', 'North', '+852 9442 0933', null, null, '10:00 - 22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Landmark North');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickleballholic.hk', 'Flat A3, 2/F, Yip Fung Industrial Building, 28 Kwai Fung Crescent, Kwai Chung', 'Kwai Tsing', '+852 6990 3593', null, null, 'Open 24 hours', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Pickleballholic.hk');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'AllDay Pickle Co.', 'Room 904, 9/F, Prowell Asia Centre, 926 Cheung Sha Wan Road, Lai Chi Kok, Kowloon', 'Sham Shui Po', '+852 9474 7571', 'alldaypickleco', null, 'Daily, 24 hours', null, 'approved', false
where not exists (select 1 from public.venues where name = 'AllDay Pickle Co.');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Courtyard by Marriott Hong Kong Sha Tin', '1 On Ping Street, Shek Mun, Sha Tin', 'Sha Tin', null, null, null, null, null, 'pending', false
where not exists (select 1 from public.venues where name = 'Courtyard by Marriott Hong Kong Sha Tin');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickle Vibes', 'Units B-D, 8/F, Fortune Plaza, 37-39 Wing Hong Street, Lai Chi Kok', 'Sham Shui Po', '+852 6190 2761', 'picklevibes.hk', 'info@picklevibes.hk', '24/7 Open (by booking)', 'https://picklevibes.hk/', 'approved', false
where not exists (select 1 from public.venues where name = 'Pickle Vibes');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'The Pickle House', '1/F, Viva Place, Wong Chuk Hang', 'Southern', '+852 5464 7443', null, null, '08:00 - 00:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'The Pickle House');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Hey Hey Pickleball Club', '香港觀塘鴻圖道35號德華中心2樓202室', 'Kwun Tong', '+852 6342 7435', 'heyhey_pickleball', null, 'Mon-Sun 24 hours', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Hey Hey Pickleball Club');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Stackd Pickleball', 'Shops 337-338, 3/F, Hopewell Mall, 183 Queen''s Road East, Wan Chai', 'Wan Chai', '+852 6368 1655', null, null, 'Daily 07:00 - 23:00', 'https://book.stackdpb.com', 'approved', false
where not exists (select 1 from public.venues where name = 'Stackd Pickleball');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickle City', 'Room 2710, Cable TV Tower, 9 Hoi Shing Road, Tsuen Wan', 'Tsuen Wan', '+852 5273 1223', null, null, 'Open 24 hours', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Pickle City');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickledise.hk', 'Units 1203-04, International Trade and Exhibition Centre Phase 3, 18 Tai Chung Road, Tsuen Wan', 'Tsuen Wan', '+852 6168 1838', null, null, 'Daily 07:00 - 01:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Pickledise.hk');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Bay Pickle (Tin Hau)', 'Shop 1-2, G/F, 23 Jupiter Street, Tin Hau', 'Eastern', '+852 4608 3998', null, null, 'Open 24 hours', 'https://thebaypickle.com/hk-island-tin-hau', 'approved', false
where not exists (select 1 from public.venues where name = 'Bay Pickle (Tin Hau)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Hong Kong Gold Coast Hotel', '1 Castle Peak Road - Castle Peak Bay, Sham Tseng', 'Tuen Mun', null, 'GoldCoastHotel', 'info@goldcoasthotel.com.hk', 'Daily 10:00 - 20:00', 'https://www.sino-hotels.com/en/hk/gold-coast-hotel/facilities/experience-the-thrill-of-pickleball', 'pending', false
where not exists (select 1 from public.venues where name = 'Hong Kong Gold Coast Hotel');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Tuen Mun Recreation Centre', 'Address to be confirmed', 'Tuen Mun', null, null, null, null, null, 'pending', false
where not exists (select 1 from public.venues where name = 'Tuen Mun Recreation Centre');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pick & Match', '1303, MegaBox, 38 Wang Chiu Road, Kowloon Bay, Hong Kong', 'Kwun Tong', '+852 6808 3392', 'pickandmatch.hk', null, '10:00 - 00:00', 'https://www.pickandmatch.hk/', 'approved', false
where not exists (select 1 from public.venues where name = 'Pick & Match');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Sportsmile by Sport-à-Tous', 'Shop 1502, Square Mile 11 Li Tak St, Tai Kok Tsui', 'Yau Tsim Mong', '+852 6555 9271', null, null, 'Open 24 hours', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Sportsmile by Sport-à-Tous');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pick It Up', 'Unit B, 13/F, Wah Fung Industrial Centre, 33-39 Kwai Fung Crescent, Kwai Chung', 'Kwai Tsing', '+852 6919 4985', 'pickitup.hk', null, 'Open 24 hours', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Pick It Up');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Dink Pod', 'Unit A, H & G, 19/F, Legend Tower, 7 Shing Yip St, Kwun Tong, Hong Kong', 'Kwun Tong', '+852 6291 8884', 'dinkpod.pickleball', 'dinkpodpickleball@gmail.com', 'Mon-Sun 08:00 - 00:00', 'https://dinkpod.com.hk', 'approved', false
where not exists (select 1 from public.venues where name = 'Dink Pod');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickle Go HK', 'Unit 2522, Enterprise Square, 11 On Lai Street, Shek Mun', 'Sha Tin', '+852 6951 9942', null, null, '10:00-22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Pickle Go HK');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PICK POP', '九龍灣宏照道23號第一集團中心1704室', 'Kwun Tong', '+852 6509 8298', 'pickpop.club', null, 'Open 24 hours', 'https://pickpop.club/', 'approved', false
where not exists (select 1 from public.venues where name = 'PICK POP');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'The Pickleball Lab (Tuen Mun Town Plaza)', 'TMTP Commons, 4/F, Tuen Mun Town Plaza, Tuen Mun', 'Tuen Mun', '+852 6902 9606', null, null, '09:00 - 21:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'The Pickleball Lab (Tuen Mun Town Plaza)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'TennisLOFT', 'Unit A, 12/F, Kin Teck Industrial Building, 26 Wong Chuk Hang Road', 'Southern', null, null, null, 'Weekdays 10:00 - 22:30 ; Sat, Sun & public holidays 09:00 - 22:30', null, 'approved', false
where not exists (select 1 from public.venues where name = 'TennisLOFT');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickle Master', 'We Go Mall, 16 Po Tai Street, Ma On Shan, Sha Tin', 'Sha Tin', '+852 6687 0854', 'picklemaster.hk', null, 'Daily 07:00 - 00:00', 'https://www.pickle-master.com/', 'approved', false
where not exists (select 1 from public.venues where name = 'Pickle Master');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'TKO Plaza', '1/F, TKO Plaza, 1 Tong Tak Street, Tseung Kwan O', 'Sai Kung', null, 'tkoplaza', null, 'Daily 10:00am – 9:00pm Pop-up event: 2 July – 10 September 2026', 'https://www.tkoplaza.com.hk', 'pending', false
where not exists (select 1 from public.venues where name = 'TKO Plaza');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'My Pickle World', '15/F, City Industrial Centre, 116-122 Kwok Shui Road, Kwai Chung', 'Kwai Tsing', '+852 9650 1291', 'mypickleworld', null, 'Open 24 hours', 'https://www.mypickleworldhk.com/', 'approved', false
where not exists (select 1 from public.venues where name = 'My Pickle World');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'GO PARK Sai Sha', '9 Hoi Ying Road, GO PARK Sai Sha, Ma On Shan', 'Sai Kung', '+852 9133 0596', 'goparksaisha', 'enquiry@goparksports.hk', 'Daily 08:00 - 23:00', 'https://goparksports.hk/', 'pending', false
where not exists (select 1 from public.venues where name = 'GO PARK Sai Sha');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Bay Pickle (Tsuen Wan D·PARK)', 'G/F Atrium, D·PARK, 398 Castle Peak Road - Tsuen Wan', 'Tsuen Wan', '+852 5702 8701', null, null, '10:00 - 22:00', 'https://thebaypickle.com/tsuen-wan-d-park', 'approved', false
where not exists (select 1 from public.venues where name = 'Bay Pickle (Tsuen Wan D·PARK)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Asia Aces Pickleball Academy', '12/F, S22, 22 Heung Yip Rd, Wong Chuk Hang, Hong Kong', 'Southern', '+852 6082 6655', 'aapa.pb', 'info@aapa.com.hk', 'Mon-Thu, Sun 10:00 - 23:00; Fri-Sat 10:00 - 00:00', 'https://aapa.com.hk', 'approved', false
where not exists (select 1 from public.venues where name = 'Asia Aces Pickleball Academy');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Ascend Sport (Quarry Bay)', 'Westlands Centre, Quarry Bay', 'Eastern', null, 'striver__sports', null, null, 'https://instagram.com/striver__sports', 'approved', false
where not exists (select 1 from public.venues where name = 'Ascend Sport (Quarry Bay)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PickleHuman.', 'Romm 2705, 27/F, Cable TV Tower, 9 Hoi Shing Road, Tsuen Wan', 'Tsuen Wan', '+852 4429 3597', 'picklehuman.hk', null, 'Open 24 hours', 'https://www.pickle-human.com', 'approved', false
where not exists (select 1 from public.venues where name = 'PickleHuman.');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PickleIsland (Fo Tan)', 'Unit 4, 18/F, Wah Wai Centre, 38-40 Au Pui Wan Street, Fo Tan, NT', 'Sha Tin', '+852 6610 0026', 'pickleisland.hk', null, 'Mon - Sun 24 hours', 'https://www.pickleislandhk.com', 'approved', false
where not exists (select 1 from public.venues where name = 'PickleIsland (Fo Tan)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PickOne', '25/F, The Burrow, 212 Choi Hung Road, San Po Kong', 'Wong Tai Sin', '+852 9682 1240', null, null, '09:00–22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'PickOne');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Bay Pickle (Wong Chuk Hang)', 'Shop G01, G/F, One Island South, 2 Heung Yip Road, Wong Chuk Hang', 'Southern', '+852 5702 8701', null, null, 'Open 24 hours', 'https://thebaypickle.com/south-island', 'approved', false
where not exists (select 1 from public.venues where name = 'Bay Pickle (Wong Chuk Hang)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Ascend Sport (Kwun Tong)', 'Unit E, 15/F, Boltton Centre, 368 Kwun Tong Road, Kwun Tong', 'Kwun Tong', null, 'striver__sports', null, null, 'https://instagram.com/striver__sports', 'approved', false
where not exists (select 1 from public.venues where name = 'Ascend Sport (Kwun Tong)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Waterfall Sports & Wellness (Olympic)', '2/F, Olympian City 1, 11 Hoi Fai Road, Tai Kok Tsui', 'Yau Tsim Mong', '+852 6626 5603', null, null, '09:00 - 22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Waterfall Sports & Wellness (Olympic)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Chinese YMCA of Hong Kong (City Branch)', 'Address to be confirmed', 'Yau Tsim Mong', null, null, null, null, null, 'pending', false
where not exists (select 1 from public.venues where name = 'Chinese YMCA of Hong Kong (City Branch)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'The Pickleball Lab (Long Yat Plaza)', '元朗康業街8號朗壹廣場2樓', 'Yuen Long', '+852 6902 9606', null, null, '10:00 -22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'The Pickleball Lab (Long Yat Plaza)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select '212HK', 'S22, 15th and 16th floors, 22 Heung Yip Rd, Wong Chuk Hang, Hong Kong', 'Southern', '+852 9500 9074', '212hong_kong', 'enquiry@212hk.com', 'Sun-Thu 09:00 - 23:00; Fri-Sat 09:00 - 03:00', 'https://212hk.com/', 'approved', false
where not exists (select 1 from public.venues where name = '212HK');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'project.polis', 'Shops 205-207, 2/F, The Mills, 45 Pak Tin Par Street, Tsuen Wan', 'Tsuen Wan', '+852 9073 5639', null, null, '11:00–17:00 (soft opening)', 'https://www.themills.com.hk/en/shop/polis/', 'pending', false
where not exists (select 1 from public.venues where name = 'project.polis');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PICKLE.READY (Tsuen Wan)', '香港荃灣大壩街4-30號荃灣廣場501號舖', 'Tsuen Wan', '+852 9860 9827', 'pickle.ready', null, 'Mon-Sun 10:00 - 22:00', 'https://picklereadyhk.com', 'approved', false
where not exists (select 1 from public.venues where name = 'PICKLE.READY (Tsuen Wan)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Stackd Pickleball (WestK Pop-up Court)', 'Units GF01-03, 22 Museum Drive, West Kowloon', 'Yau Tsim Mong', null, null, null, '09:00 - 23:00', 'https://www.eventbrite.hk/e/pickleball-at-westk-court-bookings-tickets-1984252022213', 'pending', false
where not exists (select 1 from public.venues where name = 'Stackd Pickleball (WestK Pop-up Court)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Whitehead Driving Range', 'Whitehead, Ma On Shan, Sha Tin', 'Sha Tin', null, null, null, '08:00-22:00', null, 'approved', false
where not exists (select 1 from public.venues where name = 'Whitehead Driving Range');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Regal Airport Hotel', '4/F, 9 Cheong Tat Road, Chek Lap Kok', 'Islands', null, null, null, null, null, 'pending', false
where not exists (select 1 from public.venues where name = 'Regal Airport Hotel');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'EC Sport', '14/F, City Industrial Centre, 116-122 Kwok Shui Road, Kwai Chung', 'Kwai Tsing', null, null, null, null, 'https://reclub.co/clubs/@ec-sport', 'pending', false
where not exists (select 1 from public.venues where name = 'EC Sport');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PICKLE.READY (Kowloon Bay)', 'Unit 801, First Group Centre, 23 Wang Chiu Road, Kowloon Bay', 'Kwun Tong', '+852 9860 9827', 'pickle.ready', null, 'Daily 08:00 - 00:00', 'https://picklereadyhk.com', 'approved', false
where not exists (select 1 from public.venues where name = 'PICKLE.READY (Kowloon Bay)');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'My Fitness', 'Rooms 6-7, 5/F, Block B, Hoi Luen Industrial Centre,55 Hoi Yuen Road, Kwun Tong', 'Kwun Tong', '+852 9315 3056', 'myfitnesshk', null, '09:00 - 22:00', 'https://www.myfitness.com.hk/pickleball', 'pending', false
where not exists (select 1 from public.venues where name = 'My Fitness');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'The Kensington Pickleball', 'Unit A, 13/F, 228 Electric Road, North Point', 'Eastern', '+852 6400 3580', null, null, '10:00 - 22:00', 'https://the-kensington-pickleball.mystoreberry.com', 'approved', false
where not exists (select 1 from public.venues where name = 'The Kensington Pickleball');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'PicklePickle', '3/F, Laneway, 88 Chuen Lung Street, Tsuen Wan', 'Tsuen Wan', '+852 5366 4355', 'picklepickle.hk', null, '08:00 - 22:00', 'https://linktr.ee/picklepicklehk', 'approved', false
where not exists (select 1 from public.venues where name = 'PicklePickle');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickle & Club', 'UG01, The Westwood, Belcher''s Street, Kennedy Town', 'Central and Western', '+852 6298 8284', 'pickleandclub', null, '10:00 - 22:00', 'https://pickleand.club', 'approved', false
where not exists (select 1 from public.venues where name = 'Pickle & Club');

insert into public.venues (name, address, district, whatsapp, instagram, contact_email, opening_hours, website, status, is_claimed)
select 'Pickleball Xpress', 'Unit D, 7/F, Wah Fung Industrial Centre Phase 1, 33-39 Kwai Fung Crescent, Kwai Chung', 'Kwai Tsing', '+852 6288 6735', 'hkpickleballxpress', null, '24 hours (password access)', 'https://hkpickleballxpress.com', 'approved', false
where not exists (select 1 from public.venues where name = 'Pickleball Xpress');

-- Create a claim link for every unclaimed venue that doesn't have one yet.
insert into public.venue_claims (venue_id)
select id from public.venues v where not v.is_claimed
  and not exists (select 1 from public.venue_claims c where c.venue_id = v.id);
