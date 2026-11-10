import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { formatDay, hkDate, hkTime } from "@/lib/hk-time";
import type { MyBooking } from "@/app/slots/[id]/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My bookings | Pickleball Slots HK", robots: { index: false } };

const BADGE: Record<MyBooking["status"], { label: string; cls: string }> = {
  awaiting_payment: { label: "Pay now", cls: "bg-amber-100 text-amber-900" },
  payment_reported: { label: "Checking payment", cls: "bg-sky-100 text-sky-900" },
  confirmed: { label: "Confirmed", cls: "bg-emerald-100 text-emerald-900" },
  cancelled: { label: "Cancelled", cls: "bg-black/5 text-black/60" },
  expired: { label: "Expired", cls: "bg-black/5 text-black/60" },
};

function Row({ b }: { b: MyBooking }) {
  return (
    <Link href={`/bookings/${b.booking_id}`} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3">
      <VenueBadge name={b.venue_name} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{b.venue_name}</p>
        <p className="text-xs text-black/60">
          {formatDay(hkDate(b.starts_at))} · {hkTime(b.starts_at)}–{hkTime(b.ends_at)} · {b.court_name}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${BADGE[b.status].cls}`}>{BADGE[b.status].label}</span>
    </Link>
  );
}

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const { data } = await supabase.rpc("get_my_bookings");
  const all = (data ?? []) as MyBooking[];
  const now = Date.now();
  const upcoming = all
    .filter((b) => new Date(b.ends_at).getTime() > now && b.status !== "cancelled" && b.status !== "expired")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = all.filter((b) => !upcoming.includes(b));

  return (
    <main className="space-y-5">
      <h1 className="text-xl font-semibold">My bookings</h1>
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-black/60">Upcoming</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 p-5 text-center text-sm">
            <p>No upcoming bookings.</p>
            <Link href="/slots" className="mt-2 inline-block font-medium text-emerald-700 underline">Find a discounted slot</Link>
          </div>
        ) : (
          upcoming.map((b) => <Row key={b.booking_id} b={b} />)
        )}
      </section>
      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-black/60">Past and cancelled</h2>
          {past.map((b) => <Row key={b.booking_id} b={b} />)}
        </section>
      )}
    </main>
  );
}
