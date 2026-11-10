"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDays, hkDateTime, isDateString } from "@/lib/hk-time";

export type SlotFormState = { error?: string; ok?: string } | undefined;

// Turn database rule errors into plain language.
function friendly(message: string): string {
  if (/discount_in_band/.test(message)) return "The discount must be between 20% and 30% off the normal price.";
  if (/no_overlapping_slots/.test(message)) return "This court already has a slot at that time.";
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
  const discounted = Number(form.get("discounted_price"));

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
  if (!(normal > 0)) return { error: "Please enter the normal price." };
  if (!(discounted > 0)) return { error: "Please enter the discounted price." };
  const pct = (1 - discounted / normal) * 100;
  if (pct < 20 - 1e-9 || pct > 30 + 1e-9) {
    return { error: `That's ${pct.toFixed(1)}% off. The discount must be between 20% and 30%.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("slots").insert({
    court_id: courtId,
    starts_at: hkDateTime(date, start),
    ends_at: hkDateTime(endDate, end),
    normal_price: normal,
    discounted_price: discounted,
  });
  if (error) return { error: friendly(error.message) };

  revalidatePath(`/owner/venue/${venueId}`);
  return { ok: `Slot added: ${start}–${end}, HK$${discounted} (was HK$${normal}).` };
}

export async function cancelSlot(form: FormData) {
  const venueId = String(form.get("venue_id") ?? "");
  const slotId = String(form.get("slot_id") ?? "");
  const supabase = await createClient();
  await supabase.rpc("cancel_slot", { p_slot_id: slotId });
  revalidatePath(`/owner/venue/${venueId}`);
}

export async function addCourt(_prev: SlotFormState, form: FormData): Promise<SlotFormState> {
  const venueId = String(form.get("venue_id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Please enter a court name, e.g. Court 2." };
  const supabase = await createClient();
  const { error } = await supabase.from("courts").insert({ venue_id: venueId, name });
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/owner/venue/${venueId}`);
  return { ok: `${name} added.` };
}

export async function renameCourt(_prev: SlotFormState, form: FormData): Promise<SlotFormState> {
  const venueId = String(form.get("venue_id") ?? "");
  const courtId = String(form.get("court_id") ?? "");
  const name = String(form.get("name") ?? "").trim();
  if (!name) return { error: "Court name can't be empty." };
  const supabase = await createClient();
  const { error } = await supabase.from("courts").update({ name }).eq("id", courtId);
  if (error) return { error: friendly(error.message) };
  revalidatePath(`/owner/venue/${venueId}`);
  return { ok: "Saved." };
}
