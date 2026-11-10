# Pickleball Discounted Slot Platform: v1 spec

Last updated: 2026-11-04

## Who uses it

- **Visitors (not logged in):** can browse available slots that nobody has booked. They cannot book.
- **Players:** log in with their email address. They give a phone number once, at sign-up, for verification. They can book, see and cancel their own bookings.
- **Venue admins (court owners):** each venue has 1 or 2 admins. A venue admin sees only their own venue.
- **Platform admin (us):** approves new venues and assigns their admins.

## Court owner side

- Sign up (name, email, password) and apply with a venue profile. All fields are required:
  - About the applicant: name, job title (e.g. Owner, Manager), mobile number
  - About the venue: name, full address, district, WhatsApp number, Instagram account, email address
  - A Google Maps link is built from the venue name and address, so the owner can check the location before submitting. Players get the same link. (No Google account or API key needed. Google's address autocomplete could be added later, but it needs a Google Cloud account and billing.)
- The venue stays **pending** until the platform admin approves it. Pending venues are hidden from players.
- The platform admin approves the venue and may add a second venue admin (maximum 2 per venue).
- Add courts by name ("Court 1", "Court 2"). Every new venue starts with a default "Court 1".
- **Manage slots** screen (`/owner/venue/<id>`): a 14-day day picker (dots show open and booked slots), the chosen day's slots grouped by court, and an "Add a slot" form.
  - Add a slot: pick court, start time (30-minute steps) and length (1, 1.5 or 2 hours; a late slot can finish after midnight), then enter the **normal price** and **discounted price**. Typing the normal price fills in 25% off; one-tap buttons set 20%, 25% or 30%.
  - Booked slots show the player's name, booking code and a WhatsApp button.
  - Courts can be added and renamed.
- **Venue setup** (`/owner/venue/<id>/setup`, shown right after claiming): 1) check and correct venue details (name, address, district, opening hours, WhatsApp, Instagram, email, website); 2) number of courts and their names; 3) **original price list**: rows of days + time range + price per hour (e.g. Mon–Fri 09:00–12:00 HK$250/hr; Sat & Sun 23:00–05:00 HK$200/hr, running past midnight). Rows can't overlap. A weekly chart shows which hours are covered.
- When posting a slot, the original price fills in from the price list (summed in 30-minute blocks, so a slot crossing a price change is priced correctly). The owner can change it for one slot (e.g. a public holiday).
- The owner picks a **discount rate: 20%, 25%, 30%, 35% or 40%**. The discounted price is the original price minus the rate, rounded to the dollar. Other rates are rejected by the database. Overlapping slots on the same court and slots in the past are also rejected.
- Cancel an open slot. **A booked slot can't be edited or cancelled by the owner** (only the platform admin can, in an emergency). It becomes available again only if the player cancels, and the same court and time can't be posted twice.
- See who booked each slot (name and phone).
- Mark a booking as "attended" or "no-show" once the slot has started.

## Venue directory and claim links

- We pre-list private pickleball venues ourselves ("unclaimed" listings) from our research (`docs/venues/`). Members-only clubs are excluded.
- Public **Courts** page (`/courts`): every listed venue with coloured initials (no logos until a venue agrees), address, opening hours, Google Maps, Instagram, WhatsApp and website. Filter by region. Unclaimed venues are labelled "Not taking bookings here yet".
- Each unclaimed venue gets a private **claim link**. The owner opens it, creates an account (or logs in), confirms their details (name, job title, mobile, venue WhatsApp, Instagram, email), and the venue becomes theirs and is approved straight away.
- A link works once. Only the platform admin can see claim links.
- Imported venues that need checking start hidden. The platform admin shows them from the admin page.
- **Admin page** (`/admin`, platform admin only): approve or reject owner applications, copy or WhatsApp each venue's claim link, and show or hide listings.

## Player side

- **Slots** (`/slots`): discounted slots for the next 14 days, filter by day, region and time of day (morning, afternoon, evening, late night).
- **Slot page** (`/slots/<id>`): time, price, venue, map; payment rules with a tick box; book.
- **Booking page** (`/bookings/<id>`): payment details with copy buttons, countdown, I've paid, cancel; then status (checking, confirmed with code, cancelled, expired).
- **My bookings** (`/bookings`): upcoming and past.
- Players sign up with name, mobile number, email and password.


- Browse available slots and filter by **region** (Hong Kong Island / Kowloon / New Territories), district, court or venue name, date and time range.
- Slot detail, then log in (email), then book.
- **A booking is confirmed straight away** (all slots are ad hoc). The booking code and QR code are emailed to the player.
- "My bookings" page with a cancel button.

## Rules

- Only one booking per slot, enforced by the database.
- **No commission** at launch.
- **Payment: players pay the venue directly** by FPS or PayMe. After booking, the player sees the venue's payment details as text (no payment link), the amount, and their **booking code** to use as the payment reference.
  - Pay within **1 hour of booking, or before the slot starts if sooner**. Unpaid bookings expire and the slot reopens automatically.
  - The player taps **"I've paid"**: the timer stops and the venue is emailed to check.
  - The venue taps **Payment received** (booking confirmed and locked: no refund, no reposting of that court and time) or **Not received** (booking cancelled, slot reopens).
  - Players can **cancel free of charge before paying**. **Payments are non-refundable.** If the venue has to cancel (emergency, via the platform admin), **the venue refunds in full**.
  - One unpaid booking at a time per player. Two expired bookings in 7 days pauses booking for 7 days.
  - Venues add payment details (FPS ID and/or PayMe, account name) in setup. Their slots only show to players once these are set.
- Emails (booking code, no QR code): payment instructions to the player on booking; "please check payment" to the venue when the player taps I've paid; confirmation to **both** when the venue confirms; a cancellation note to the player if the venue says not received.
- Each venue stores both a district and a region. The region is filled in automatically from the district.
- All times are in Hong Kong time.

## Not in v1

Ratings, chat, native app. (Payment method: to be decided; see notes.)

## Still to set up (later steps)

- **Phone verification by SMS** needs an SMS provider (e.g. Twilio), which costs money per message. Until then the phone number is collected but not verified.
- **Booking emails with QR codes** need an email-sending service (e.g. Resend, which has a free tier).
