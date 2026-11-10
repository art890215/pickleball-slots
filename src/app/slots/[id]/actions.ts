"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { playerPayNowEmail, sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";

export type BookState = { error?: string } | undefined;

export async function bookSlot(_prev: BookState, form: FormData): Promise<BookState> {
  const slotId = String(form.get("slot_id") ?? "");
  const fullName = String(form.get("full_name") ?? "").trim();
  const phone = normalizePhone(String(form.get("phone") ?? ""));
  if (form.get("agree") !== "on") return { error: "Please tick the box to agree to the payment rules." };
  if (!fullName) return { error: "Please enter your name." };
  if (!phone) return { error: "Please enter a valid mobile number, e.g. 9123 4567." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/slots/${slotId}`);

  await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);

  const { data: booking, error } = await supabase.rpc("book_slot", { p_slot_id: slotId }).single<{ id: string }>();
  if (error || !booking) return { error: error?.message ?? "Couldn't book this slot." };

  // Email the payment instructions to the player.
  const [{ data: mine }, { data: pay }] = await Promise.all([
    supabase.rpc("get_my_bookings", { p_booking_id: booking.id }).single<MyBooking>(),
    supabase.rpc("get_booking_payment", { p_booking_id: booking.id }).single<{ fps_id: string | null; payme_id: string | null; account_name: string }>(),
  ]);
  if (mine && pay) {
    const site = await siteUrl();
    const mail = playerPayNowEmail(
      {
        code: mine.booking_code,
        venueName: mine.venue_name,
        courtName: mine.court_name,
        address: mine.address,
        startsAt: mine.starts_at,
        endsAt: mine.ends_at,
        price: Number(mine.discounted_price),
        playerName: fullName,
        playerPhone: phone,
        siteUrl: site,
      },
      { fps: pay.fps_id, payme: pay.payme_id, name: pay.account_name },
      mine.payment_due_at,
      `${site}/bookings/${booking.id}`,
    );
    await sendEmail({ to: user.email, ...mail, replyTo: mine.venue_email });
  }
  redirect(`/bookings/${booking.id}`);
}

export type MyBooking = {
  booking_id: string;
  booking_code: string;
  status: "awaiting_payment" | "payment_reported" | "confirmed" | "cancelled" | "expired";
  payment_due_at: string;
  paid_reported_at: string | null;
  payment_confirmed_at: string | null;
  cancelled_by: string | null;
  cancel_reason: string | null;
  refund_due: boolean;
  created_at: string;
  starts_at: string;
  ends_at: string;
  normal_price: number;
  discounted_price: number;
  discount_rate: number | null;
  court_name: string;
  venue_id: string;
  venue_name: string;
  address: string;
  district: string;
  venue_whatsapp: string | null;
  venue_email: string | null;
};
