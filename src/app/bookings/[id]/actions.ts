"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, venueCheckPaymentEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { hkDate } from "@/lib/hk-time";
import type { MyBooking } from "@/app/slots/[id]/actions";

export type ActionState = { error?: string } | undefined;

export async function reportPaid(_prev: ActionState, form: FormData): Promise<ActionState> {
  const id = String(form.get("booking_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("report_payment", { p_booking_id: id });
  if (error) return { error: error.message };

  // Ask the venue to check the payment.
  const { data: b } = await supabase.rpc("get_my_bookings", { p_booking_id: id }).single<MyBooking>();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, phone").eq("id", user?.id ?? "").maybeSingle();
  if (b?.venue_email) {
    const site = await siteUrl();
    const mail = venueCheckPaymentEmail(
      {
        code: b.booking_code,
        venueName: b.venue_name,
        courtName: b.court_name,
        address: b.address,
        startsAt: b.starts_at,
        endsAt: b.ends_at,
        price: Number(b.discounted_price),
        playerName: profile?.full_name ?? "A player",
        playerPhone: profile?.phone,
        siteUrl: site,
      },
      `${site}/owner/venue/${b.venue_id}?date=${hkDate(b.starts_at)}`,
    );
    await sendEmail({ to: b.venue_email, ...mail });
  }
  revalidatePath(`/bookings/${id}`);
  return undefined;
}

export async function cancelMyBooking(_prev: ActionState, form: FormData): Promise<ActionState> {
  const id = String(form.get("booking_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", { p_booking_id: id });
  if (error) return { error: error.message };
  revalidatePath(`/bookings/${id}`);
  revalidatePath("/bookings");
  return undefined;
}
