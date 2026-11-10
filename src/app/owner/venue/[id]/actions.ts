"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, hkDateTime, isDateString } from "@/lib/hk-time";
import { DISCOUNT_RATES, discountedPrice } from "@/lib/pricing";
import { confirmedEmail, notReceivedEmail, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";

export type SlotFormState = { error?: string; ok?: string } | undefined;

// Turn database rule errors into plain language.
function friendly(message: string): string {
  if (/discount_in_band|discount_rate|matches_rate/.test(message)) return "The discount must be 20%, 25%, 30%, 35% or 40%.";
  if (/no_overlapping_slots/.test(message)) {
    return "This court already has a slot at that time (if it's booked, it only opens again when the player cancels).";
  }
  if (/start in the future/.test(message)) return "That time has already passed. Pick a later time.";
  if (/slot_time_order/.test(message)) return "The end time must be after the start time.";
  if (/courts_venue_id_name_key|duplicate key/.test(message)) return "You already have a court with that name.";
  if (/row-level security/.test(message)) return "You don't have permission to change this venue.";
  return message;
}

export async function addSlot(_prev: SlotFormState, form: FormData): Promise<SlotFormState> {
  const venueId = String(form.get("venue_id") ?? "");
  const courtId = String(form.get("court_id") ?? "");
  const date = String(form.get("date") ?? "");
  const start = String(form.get("start") ?? "");
  const duration = Number(form.get("duration_minutes"));
  const normal = Number(form.get("normal_price"));
  const rate = Number(form.get("discount_rate"));

  if (!courtId) return { error: "Please choose a court." };
  if (!isDateString(date)) return { error: "Please choose a date." };
  if (!/^\d{2}:\d{2}$/.test(start)) return { error: "Please choose a start time." };
  if (!(duration >= 30 && duration <= 240)) return { error: "Please choose how long the slot is." };

  // Work out the end time; a late slot may finish after midnight.
  const [h, m] = start.split(":").map(Number);
  const endMinutes = h * 60 + m + duration;
  const endDate = endMinutes >= 24 * 60 ? addDays(date, 1) : date;
  const endMin = endMinutes % (24 * 60);
  const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
  if (!(normal > 0)) return { error: "Please enter the original price." };
  if (!(DISCOUNT_RATES as readonly number[]).includes(rate)) return { error: "Please choose a discount." };
  const discounted = discountedPrice(normal, rate);

  const supabase = await createClient();
  const { error } = await supabase.from("slots").insert({
    court_id: courtId,
    starts_at: hkDateTime(date, start),
    ends_at: hkDateTime(endDate, end),
    normal_price: normal,
    discounted_price: discounted,
    discount_rate: rate,
  });
  if (error) return { error: friendly(error.message) };

  revalidatePath(`/owner/venue/${venueId}`);
  return { ok: `Posted ${start}–${end}: HK$${discounted} (${rate}% off HK$${normal}).` };
}

export async function cancelSlot(form: FormData) {
  const venueId = String(form.get("venue_id") ?? "");
  const slotId = String(form.get("slot_id") ?? "");
  const supabase = await createClient();
  await supabase.rpc("cancel_slot", { p_slot_id: slotId });
  revalidatePath(`/owner/venue/${venueId}`);
}

type BookingRow = {
  id: string;
  booking_code: string;
  player_name: string;
  player_phone: string;
  player_email: string | null;
  slot: {
    starts_at: string;
    ends_at: string;
    discounted_price: number;
    court: { name: string; venue: { name: string; address: string; contact_email: string | null } };
  };
};

async function bookingInfo(bookingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, booking_code, player_name, player_phone, player_email, slot:slots(starts_at, ends_at, discounted_price, court:courts(name, venue:venues(name, address, contact_email)))",
    )
    .eq("id", bookingId)
    .single();
  const b = data as unknown as BookingRow | null;
  if (!b) return null;
  const site = await siteUrl();
  return {
    playerEmail: b.player_email,
    venueEmail: b.slot.court.venue.contact_email,
    info: {
      code: b.booking_code,
      venueName: b.slot.court.venue.name,
      courtName: b.slot.court.name,
      address: b.slot.court.venue.address,
      startsAt: b.slot.starts_at,
      endsAt: b.slot.ends_at,
      price: Number(b.slot.discounted_price),
      playerName: b.player_name,
      playerPhone: b.player_phone,
      siteUrl: site,
    },
  };
}

export async function confirmPayment(_prev: SlotFormState, form: FormData): Promise<SlotFormState> {
  const venueId = String(form.get("venue_id") ?? "");
  const bookingId = String(form.get("booking_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirm_payment", { p_booking_id: bookingId });
  if (error) return { error: error.message };
  const b = await bookingInfo(bookingId);
  if (b) {
    await Promise.all([
      sendEmail({ to: b.playerEmail, ...confirmedEmail(b.info, false), replyTo: b.venueEmail }),
      sendEmail({ to: b.venueEmail, ...confirmedEmail(b.info, true) }),
    ]);
  }
  revalidatePath(`/owner/venue/${venueId}`);
  return undefined;
}

export async function rejectPayment(_prev: SlotFormState, form: FormData): Promise<SlotFormState> {
  const venueId = String(form.get("venue_id") ?? "");
  const bookingId = String(form.get("booking_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_payment", { p_booking_id: bookingId });
  if (error) return { error: error.message };
  const b = await bookingInfo(bookingId);
  if (b) await sendEmail({ to: b.playerEmail, ...notReceivedEmail(b.info), replyTo: b.venueEmail });
  revalidatePath(`/owner/venue/${venueId}`);
  return undefined;
}
