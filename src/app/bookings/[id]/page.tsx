import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CopyButton } from "@/components/copy-button";
import { VenueBadge } from "@/components/venue-badge";
import { formatDay, hkDate, hkTime } from "@/lib/hk-time";
import { googleMapsUrl, whatsappUrl } from "@/lib/venue-links";
import type { MyBooking } from "@/app/slots/[id]/actions";
import { CancelButton, Countdown, PaidButton } from "./payment-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking | Pickleball Slots HK", robots: { index: false } };

const copyBtn = "shrink-0 rounded-lg border border-black/15 bg-white px-2.5 py-1 text-xs font-medium";

function PayRow({ label, value, copy = value }: { label: string; value: string; copy?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-black/50">{label}</p>
        <p className="break-all text-lg font-semibold tabular-nums">{value}</p>
      </div>
      <CopyButton text={copy} label="Copy" className={copyBtn} />
    </div>
  );
}

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/bookings/${id}`);

  const { data } = await supabase.rpc("get_my_bookings", { p_booking_id: id });
  const b = (data as MyBooking[] | null)?.[0];
  if (!b) notFound();

  const live = b.status === "awaiting_payment" || b.status === "payment_reported" || b.status === "confirmed";
  const { data: payRows } = live ? await supabase.rpc("get_booking_payment", { p_booking_id: id }) : { data: null };
  const pay = (payRows as { fps_id: string | null; payme_id: string | null; account_name: string }[] | null)?.[0];
  const price = Number(b.discounted_price);

  const header: Record<MyBooking["status"], { title: string; tone: string }> = {
    awaiting_payment: { title: "Almost there: please pay the venue", tone: "bg-amber-500" },
    payment_reported: { title: "Waiting for the venue to confirm", tone: "bg-sky-600" },
    confirmed: { title: "Booking confirmed ✓", tone: "bg-emerald-700" },
    cancelled: { title: "Booking cancelled", tone: "bg-black/50" },
    expired: { title: "Booking expired", tone: "bg-black/50" },
  };

  return (
    <main className="space-y-4">
      <Link href="/bookings" className="text-sm text-emerald-700">← My bookings</Link>

      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className={`${header[b.status].tone} p-4 text-white`}>
          <p className="font-semibold">{header[b.status].title}</p>
          <p className="mt-1 text-sm text-white/85">
            {formatDay(hkDate(b.starts_at))} · {hkTime(b.starts_at)}–{hkTime(b.ends_at)} · {b.court_name}
          </p>
        </div>
        <div className="flex items-center gap-3 p-4">
          <VenueBadge name={b.venue_name} size={40} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug">{b.venue_name}</p>
            <p className="truncate text-xs text-black/60">{b.address}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-black/50">Booking code</p>
            <p className="font-mono text-lg font-bold tracking-wider">{b.booking_code}</p>
          </div>
        </div>
      </section>

      {b.status === "awaiting_payment" && pay && (
        <>
          <Countdown dueAt={b.payment_due_at} />
          <section className="rounded-2xl border border-black/10 bg-white p-4">
            <h2 className="font-semibold">Pay the venue</h2>
            <p className="mt-0.5 text-sm text-black/60">
              Open your banking or PayMe app and send the payment to the details below.
            </p>
            <div className="mt-2 divide-y divide-black/10">
              <PayRow label="Amount" value={`HK$${price}`} copy={String(price)} />
              {pay.fps_id && <PayRow label="FPS ID" value={pay.fps_id} />}
              {pay.payme_id && <PayRow label="PayMe" value={pay.payme_id} />}
              <div className="py-2">
                <p className="text-xs text-black/50">Account name (check it matches)</p>
                <p className="font-semibold">{pay.account_name}</p>
              </div>
              <PayRow label="Reference: put this in the payment message" value={b.booking_code} />
            </div>
          </section>
          <PaidButton bookingId={id} />
          <CancelButton bookingId={id} />
        </>
      )}

      {b.status === "payment_reported" && (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <p>Thanks! We&apos;ve asked {b.venue_name} to confirm your HK${price} payment. You&apos;ll get an email when they do.</p>
          <p className="mt-2">Your slot is held while they check. Payments are non-refundable.</p>
        </section>
      )}

      {b.status === "confirmed" && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-sm text-emerald-900">Show this code at the venue</p>
          <p className="my-1 font-mono text-4xl font-bold tracking-[0.2em] text-emerald-900">{b.booking_code}</p>
          <p className="text-xs text-emerald-900/70">Paid HK${price}. Non-refundable; if the venue cancels, they refund in full.</p>
        </section>
      )}

      {b.status === "cancelled" && (
        <section className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
          <p>
            {b.cancelled_by === "player"
              ? "You cancelled this booking before paying."
              : b.cancel_reason === "Payment not received"
                ? "The venue didn't receive your payment, so the booking was cancelled. If you did pay, please WhatsApp the venue with your booking code and payment screenshot."
                : "The venue had to cancel this slot."}
          </p>
          {b.refund_due && <p className="mt-2 font-medium">You paid for this booking, so the venue will refund you in full.</p>}
        </section>
      )}

      {b.status === "expired" && (
        <section className="rounded-2xl border border-black/10 bg-white p-4 text-sm">
          <p>Payment wasn&apos;t confirmed in time, so the slot was released.</p>
          <Link href="/slots" className="mt-2 inline-block text-emerald-700 underline">Find another slot</Link>
        </section>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        <a href={googleMapsUrl(b.venue_name, b.address)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/15 bg-white px-3 py-1.5">📍 Map</a>
        {b.venue_whatsapp && (
          <a href={whatsappUrl(b.venue_whatsapp, `Hi, about my booking ${b.booking_code}`)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/15 bg-white px-3 py-1.5">
            WhatsApp venue
          </a>
        )}
      </div>
    </main>
  );
}
