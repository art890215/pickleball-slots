"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { isValidEmail, normalizeInstagram } from "@/lib/venue-links";
import type { FormState } from "@/app/owner/actions";

export async function claimVenue(_prev: FormState, form: FormData): Promise<FormState> {
  const text = (k: string) => String(form.get(k) ?? "").trim();
  const token = text("token");
  const fullName = text("full_name");
  const title = text("applicant_title");
  const phone = normalizePhone(text("phone"));
  const whatsapp = normalizePhone(text("whatsapp"));
  const instagram = normalizeInstagram(text("instagram"));
  const email = text("contact_email");

  if (!fullName) return { error: "Please enter your name." };
  if (!title) return { error: "Please enter your job title, e.g. Owner or Manager." };
  if (!phone) return { error: "Please enter a valid mobile number, e.g. 9123 4567." };
  if (!whatsapp) return { error: "Please enter a valid WhatsApp number for the venue." };
  if (!instagram) return { error: "Please enter the venue's Instagram account, e.g. @tsuenwanpickle." };
  if (!isValidEmail(email)) return { error: "Please enter a valid email address for the venue." };

  const supabase = await createClient();
  const { data: venueId, error } = await supabase.rpc("claim_venue", {
    p_token: token,
    p_full_name: fullName,
    p_applicant_title: title,
    p_phone: phone,
    p_whatsapp: whatsapp,
    p_instagram: instagram,
    p_contact_email: email,
  });
  if (error) return { error: error.message };
  redirect(`/owner/venue/${venueId}/setup?claimed=1`);
}
