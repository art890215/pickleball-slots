"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["approved", "rejected", "pending"] as const;

export async function setVenueStatus(form: FormData) {
  const id = String(form.get("venue_id") ?? "");
  const status = String(form.get("status") ?? "") as (typeof ALLOWED)[number];
  if (!id || !ALLOWED.includes(status)) return;
  const supabase = await createClient();
  // The database only lets a platform admin change this.
  await supabase.from("venues").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function createClaimLink(form: FormData) {
  const id = String(form.get("venue_id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("venue_claims").insert({ venue_id: id });
  revalidatePath("/admin");
}
