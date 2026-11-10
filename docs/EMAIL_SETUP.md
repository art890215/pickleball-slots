# Turning on booking emails

The site sends booking emails with [Resend](https://resend.com). Until it's set up, nothing is sent (the site works normally).

1. Buy a domain (e.g. `pickleslots.hk`) if you haven't.
2. Create a free account at resend.com, then **Domains → Add domain** and add the DNS records it shows at your domain provider. Wait until it says **Verified**.
3. In Resend, **API Keys → Create API key** (sending access). Copy it. Don't paste it into chat.
4. In Vercel → your project → **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = the key from step 3
   - `EMAIL_FROM` = e.g. `Pickleball Slots HK <bookings@pickleslots.hk>` (must use your verified domain)
5. Redeploy (Deployments → … → Redeploy).
6. Also in Supabase → Authentication → **Emails → SMTP settings**, you can use Resend for sign-up emails too, then switch **Confirm email** back on.
