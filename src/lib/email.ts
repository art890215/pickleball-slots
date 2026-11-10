// Booking emails, sent with Resend (https://resend.com).
// Switched off until RESEND_API_KEY and EMAIL_FROM are set in Vercel, so the
// site works without them; nothing is sent and a note is logged instead.

import { formatDay, hkDate, hkTime } from "./hk-time";

type Email = { to: string | null | undefined; subject: string; html: string; replyTo?: string | null };

export async function sendEmail({ to, subject, html, replyTo }: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!to) return;
  if (!key || !from) {
    console.log(`[email not configured] would send "${subject}" to ${to}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.error(`[email failed] ${res.status} ${await res.text()}`);
  } catch (e) {
    // Never let an email problem break a booking.
    console.error("[email failed]", e);
  }
}

export type BookingInfo = {
  code: string;
  venueName: string;
  courtName: string;
  address: string;
  startsAt: string;
  endsAt: string;
  price: number;
  playerName: string;
  playerPhone?: string | null;
  siteUrl: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function when(b: BookingInfo) {
  return `${formatDay(hkDate(b.startsAt))}, ${hkTime(b.startsAt)}–${hkTime(b.endsAt)}`;
}

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f7f5;font-family:Arial,Helvetica,sans-serif;color:#1a1d1a">
<div style="max-width:520px;margin:0 auto;padding:24px 16px">
<p style="color:#047857;font-weight:bold;margin:0 0 16px">Pickleball Slots HK</p>
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px">
<h1 style="font-size:20px;margin:0 0 12px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#6b7280;margin-top:16px">You're getting this because of a booking on Pickleball Slots HK.</p>
</div></body></html>`;
}

function details(b: BookingInfo) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">${k}</td><td style="padding:4px 0">${v}</td></tr>`;
  return `<div style="text-align:center;background:#ecfdf5;border-radius:10px;padding:14px;margin:12px 0">
<div style="font-size:12px;color:#065f46">BOOKING CODE</div>
<div style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#065f46">${esc(b.code)}</div></div>
<table style="font-size:14px;border-collapse:collapse">
${row("Venue", esc(b.venueName))}${row("Court", esc(b.courtName))}${row("When", esc(when(b)))}
${row("Address", esc(b.address))}${row("Price", `HK$${b.price}`)}${row("Player", esc(b.playerName) + (b.playerPhone ? ` (${esc(b.playerPhone)})` : ""))}
</table>`;
}

// To the player, right after booking: how to pay.
export function playerPayNowEmail(b: BookingInfo, pay: { fps?: string | null; payme?: string | null; name: string }, dueAt: string, bookingUrl: string) {
  const methods = [pay.fps ? `FPS: <b>${esc(pay.fps)}</b>` : "", pay.payme ? `PayMe: <b>${esc(pay.payme)}</b>` : ""].filter(Boolean).join("<br>");
  return {
    subject: `Pay by ${hkTime(dueAt)} to keep your booking (${b.code})`,
    html: layout("Please pay to confirm your booking", `
<p>Pay <b>HK$${b.price}</b> to <b>${esc(pay.name)}</b> by <b>${hkTime(dueAt)}</b> (Hong Kong time), or the slot will be released.</p>
<p style="background:#f9fafb;border-radius:8px;padding:12px">${methods}<br>Reference / message: <b>${esc(b.code)}</b></p>
<p>Then tap <b>"I've paid"</b> on your booking page: <a href="${bookingUrl}">${bookingUrl}</a></p>
<p style="color:#92400e;font-size:13px">Payments are non-refundable. You can cancel for free before you pay.</p>
${details(b)}`),
  };
}

// To the venue, when the player taps "I've paid".
export function venueCheckPaymentEmail(b: BookingInfo, manageUrl: string) {
  return {
    subject: `Please check payment: ${b.code} · ${when(b)}`,
    html: layout("A player says they've paid", `
<p><b>${esc(b.playerName)}</b> says they've paid <b>HK$${b.price}</b> with reference <b>${esc(b.code)}</b>.</p>
<p>Please check your FPS / PayMe and tap <b>Payment received</b> (or <b>Not received</b>):<br><a href="${manageUrl}">${manageUrl}</a></p>
${details(b)}`),
  };
}

// To both, when the venue confirms payment.
export function confirmedEmail(b: BookingInfo, forVenue: boolean) {
  return {
    subject: `Confirmed: ${b.venueName} · ${when(b)} (${b.code})`,
    html: layout("Booking confirmed ✓", `
<p>${forVenue ? "Payment received. This slot is now locked." : "Your payment was received. Show this code at the venue."}</p>
${details(b)}
${forVenue ? "" : `<p style="font-size:13px;color:#6b7280">This booking is non-refundable. If the venue has to cancel, they'll refund you in full.</p>`}`),
  };
}

// To the player, when the venue says payment wasn't received.
export function notReceivedEmail(b: BookingInfo) {
  return {
    subject: `Booking cancelled: payment not received (${b.code})`,
    html: layout("Your booking was cancelled", `
<p>${esc(b.venueName)} didn't receive your payment, so the booking was cancelled.</p>
<p>If you did pay, please contact the venue on WhatsApp with your reference <b>${esc(b.code)}</b> and payment screenshot.</p>
${details(b)}`),
  };
}
