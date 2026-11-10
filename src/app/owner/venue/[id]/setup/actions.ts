"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { isValidEmail, normalizeInstagram } from "@/lib/venue-links";
import { findOverlap, type PriceRule } from "@/lib/pricing";

export type SetupState = { error?: string; ok?: string } | undefined;

const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function saveVenueDetails(_prev: SetupState, form: FormData): Promise<SetupState> {
  const venueId = text(form, "venue_id");
  const name = text(form, "name");
  const address = text(form, "address");
  const district = text(form, "district");
  const hours = text(form, "opening_hours");
  const whatsapp = normalizePhone(text(form, "whatsapp"));
  const instagram = normalizeInstagram(text(form, "instagram"));
  const email = text(form, "contact_email");
  let website = text(form, "website");

  if (!name) return { error: "Please enter the venue name." };
  if (!address) return { error: "Please enter the full address." };
  if (!district) return { error: "Please choose a district." };
  if (!whatsapp) return { error: "Please enter a valid WhatsApp number." };
  if (!instagram) return { error: "Please enter a valid Instagram account." };
  if (!isValidEmail(email)) return { error: "Please enter a valid email address." };
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`;

  const supabase = await createClient();
  const { error } = await supabase
    .from("venues")
    .update({
      name,
      address,
      district,
      opening_hours: hours || null,
      whatsapp,
      instagram,
      contact_email: email,
      website: website || null,
    })
    .eq("id", venueId);
  if (error) return { error: error.message };
  revalidatePath(`/owner/venue/${venueId}`, "layout");
  revalidatePath("/courts");
  return { ok: "Venue details saved." };
}

export async function setCourtCount(_prev: SetupState, form: FormData): Promise<SetupState> {
  const venueId = text(form, "venue_id");
  const target = Number(form.get("count"));
  if (!(target >= 1 && target <= 30)) return { error: "Choose between 1 and 30 courts." };

  const supabase = await createClient();
  const { data: courts } = await supabase.from("courts").select("id, name").eq("venue_id", venueId).order("created_at");
  const current = courts ?? [];
  if (target > current.length) {
    const names = new Set(current.map((c) => c.name));
    const toAdd: { venue_id: string; name: string }[] = [];
    for (let n = 1; toAdd.length < target - current.length; n++) {
      if (!names.has(`Court ${n}`)) toAdd.push({ venue_id: venueId, name: `Court ${n}` });
    }
    const { error } = await supabase.from("courts").insert(toAdd);
    if (error) return { error: error.message };
  } else if (target < current.length) {
    for (const c of current.slice(target).reverse()) {
      const { error } = await supabase.from("courts").delete().eq("id", c.id);
      if (error) return { error: `${c.name}: ${error.message}` };
    }
  }
  revalidatePath(`/owner/venue/${venueId}`, "layout");
  return { ok: `${target} court${target > 1 ? "s" : ""} set up.` };
}

export async function renameCourt(_prev: SetupState, form: FormData): Promise<SetupState> {
  const venueId = text(form, "venue_id");
  const name = text(form, "name");
  if (!name) return { error: "Court name can't be empty." };
  const supabase = await createClient();
  const { error } = await supabase.from("courts").update({ name }).eq("id", text(form, "court_id"));
  if (error) {
    return { error: /duplicate|unique/.test(error.message) ? "You already have a court with that name." : error.message };
  }
  revalidatePath(`/owner/venue/${venueId}`, "layout");
  return { ok: "Saved." };
}

export async function savePriceRules(venueId: string, rules: PriceRule[]): Promise<SetupState> {
  for (const [i, r] of rules.entries()) {
    const row = `Row ${i + 1}`;
    if (!r.days.length) return { error: `${row}: choose at least one day.` };
    if (!/^\d{2}:\d{2}$/.test(r.start_time) || !/^\d{2}:\d{2}$/.test(r.end_time)) return { error: `${row}: choose a time range.` };
    if (r.start_time === r.end_time) return { error: `${row}: start and end time can't be the same.` };
    if (!(Number(r.price_per_hour) > 0)) return { error: `${row}: enter a price per hour.` };
  }
  const overlap = findOverlap(rules);
  if (overlap) return { error: `Rows ${overlap[0] + 1} and ${overlap[1] + 1} overlap. Each time can only have one price.` };

  const supabase = await createClient();
  const { data: old } = await supabase.from("venue_price_rules").select("id").eq("venue_id", venueId);
  // Add the new list first, so a failure never leaves the venue without prices.
  if (rules.length) {
    const { error } = await supabase.from("venue_price_rules").insert(
      rules.map((r) => ({
        venue_id: venueId,
        days: r.days,
        start_time: r.start_time,
        end_time: r.end_time,
        price_per_hour: Number(r.price_per_hour),
      })),
    );
    if (error) return { error: error.message };
  }
  const oldIds = (old ?? []).map((o) => o.id);
  if (oldIds.length) {
    const { error } = await supabase.from("venue_price_rules").delete().in("id", oldIds);
    if (error) return { error: error.message };
  }
  revalidatePath(`/owner/venue/${venueId}`, "layout");
  return { ok: "Price list saved." };
}
