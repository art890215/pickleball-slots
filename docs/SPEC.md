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
- Weekly timetable: pick a court, date and start/end time, then enter the **normal price** and **discounted price**.
- The system works out the discount % and **rejects anything outside 20–30%**. Overlapping slots on the same court and slots in the past are also rejected.
- Edit or cancel a slot. A booked slot can't be edited; it can only be cancelled, which also cancels the player's booking.
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

- Browse available slots and filter by **region** (Hong Kong Island / Kowloon / New Territories), district, court or venue name, date and time range.
- Slot detail, then log in (email), then book.
- **A booking is confirmed straight away** (all slots are ad hoc). The booking code and QR code are emailed to the player.
- "My bookings" page with a cancel button.

## Rules

- Only one booking per slot, enforced by the database.
- Free cancellation up to **4 hours** before the start. After that the player can't cancel in the app.
- Each venue stores both a district and a region. The region is filled in automatically from the district.
- All times are in Hong Kong time.

## Not in v1

Online payment, ratings, chat, native app.

## Still to set up (later steps)

- **Phone verification by SMS** needs an SMS provider (e.g. Twilio), which costs money per message. Until then the phone number is collected but not verified.
- **Booking emails with QR codes** need an email-sending service (e.g. Resend, which has a free tier).
