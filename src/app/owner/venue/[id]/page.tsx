import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { addDays, dayParts, formatDay, hkDate, hkDayStart, hkTime, isDateString, todayHK } from "@/lib/hk-time";
import { whatsappUrl } from "@/lib/venue-links";
import { cancelSlot } from "./actions";
import { SlotForm } from "./slot-form";
import { CancelSlotButton } from "./cancel-button";
import { CourtsPanel } from "./courts-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Manage slots | Pickleball Slots HK", robots: { index: false } };

const DAYS_SHOWN = 14;

type Booking = {
  status: "confirmed" | "cancelled";
  booking_code: string;
  player_name: string;
  player_phone: string;
};
type Slot = {
  id: string;
  court_id: string;
  starts_at: string;
  ends_at: string;
  normal_price: number;
  discounted_price: number;
  discount_pct: number;
  status: "open" | "cancelled";
  bookings: Booking[];
};

export default async function VenueSlotsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { id } = await params;
  const { date: dateParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/owner/login?next=/owner/venue/${id}`);

  const { data: admin } = await supabase
    .from("venue_admins")
    .select("venue:venues(id, name, district, status)")
    .eq("user_id", user.id)
    .eq("venue_id", id)
    .maybeSingle();
  const venue = admin?.venue as unknown as { id: string; name: string; district: string; status: string } | null;
  if (!venue) notFound();

  const today = todayHK();
  const lastDay = addDays(today, DAYS_SHOWN - 1);
  const date = isDateString(dateParam) && dateParam >= today && dateParam <= lastDay ? dateParam : today;
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => addDays(today, i));

  const [{ data: courtRows }, { data: lastSlot }] = await Promise.all([
    supabase.from("courts").select("id, name").eq("venue_id", id).order("name"),
    supabase
      .from("slots")
      .select("normal_price, courts!inner(venue_id)")
      .eq("courts.venue_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const courts = courtRows ?? [];
  const courtIds = courts.map((c) => c.id);

  const { data: slotRows } = courtIds.length
    ? await supabase
        .from("slots")
        .select(
          "id, court_id, starts_at, ends_at, normal_price, discounted_price, discount_pct, status, bookings(status, booking_code, player_name, player_phone)",
        )
        .in("court_id", courtIds)
        .gte("starts_at", hkDayStart(today))
        .lt("starts_at", hkDayStart(addDays(lastDay, 1)))
        .order("starts_at")
    : { data: [] };
  const slots = (slotRows ?? []) as Slot[];

  const perDay = new Map<string, { open: number; booked: number }>();
  for (const s of slots) {
    if (s.status !== "open") continue;
    const d = hkDate(s.starts_at);
    const c = perDay.get(d) ?? { open: 0, booked: 0 };
    if (s.bookings.some((b) => b.status === "confirmed")) c.booked++;
    else c.open++;
    perDay.set(d, c);
  }
  const daySlots = slots.filter((s) => hkDate(s.starts_at) === date);
  const lastEnd = daySlots.filter((s) => s.status === "open").at(-1)?.ends_at;
  const suggestedStart = lastEnd && hkDate(lastEnd) === date ? hkTime(lastEnd) : "18:00";

  if (venue.status !== "approved") {
    return (
      <main className="space-y-3">
        <Link href="/owner" className="text-sm text-emerald-700">← Back</Link>
        <h1 className="text-xl font-semibold">{venue.name}</h1>
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          You can post slots once your venue is approved.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-5">
      <div className="flex items-center gap-3">
        <VenueBadge name={venue.name} size={44} />
        <div className="min-w-0">
          <Link href="/owner" className="text-xs text-emerald-700">← My venue</Link>
          <h1 className="truncate text-lg font-semibold leading-tight">{venue.name}</h1>
        </div>
      </div>

      {/* Day picker */}
      <nav aria-label="Choose a day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {days.map((d) => {
          const p = dayParts(d);
          const c = perDay.get(d);
          const active = d === date;
          return (
            <Link
              key={d}
              href={`/owner/venue/${id}?date=${d}`}
              scroll={false}
              aria-current={active ? "date" : undefined}
              className={`flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 ${
                active ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/10 bg-white"
              }`}
            >
              <span className={`text-[11px] ${active ? "text-white/80" : "text-black/50"}`}>
                {d === today ? "Today" : p.weekday}
              </span>
              <span className="text-lg font-semibold leading-tight">{p.day}</span>
              <span className="mt-0.5 flex h-2 gap-0.5">
                {c?.open ? <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : "bg-emerald-600"}`} /> : null}
                {c?.booked ? <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-amber-200" : "bg-amber-500"}`} /> : null}
              </span>
            </Link>
          );
        })}
      </nav>
      <p className="-mt-3 flex gap-4 text-xs text-black/50">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> open</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> booked</span>
      </p>

      {/* The day's slots, by court */}
      <section className="space-y-3">
        <h2 className="font-semibold">{date === today ? "Today" : formatDay(date)}</h2>
        {daySlots.length === 0 && (
          <p className="rounded-xl border border-dashed border-black/15 p-4 text-center text-sm text-black/60">
            No slots yet. Add your first one below.
          </p>
        )}
        {courts
          .filter((c) => daySlots.some((s) => s.court_id === c.id))
          .map((court) => (
            <div key={court.id} className="space-y-2">
              {courts.length > 1 && <h3 className="text-sm font-medium text-black/60">{court.name}</h3>}
              {daySlots
                .filter((s) => s.court_id === court.id)
                .map((s) => {
                  const booking = s.bookings.find((b) => b.status === "confirmed");
                  const cancelled = s.status === "cancelled";
                  return (
                    <div
                      key={s.id}
                      className={`rounded-xl border p-3 ${
                        cancelled
                          ? "border-black/10 bg-black/[0.02] opacity-60"
                          : booking
                            ? "border-amber-300 bg-amber-50"
                            : "border-black/10 bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold tabular-nums">
                            {hkTime(s.starts_at)}–{hkTime(s.ends_at)}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">HK${Number(s.discounted_price)}</span>{" "}
                            <span className="text-black/40 line-through">HK${Number(s.normal_price)}</span>{" "}
                            <span className="text-emerald-700">{Number(s.discount_pct)}% off</span>
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            cancelled
                              ? "bg-black/5 text-black/60"
                              : booking
                                ? "bg-amber-200 text-amber-900"
                                : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {cancelled ? "Cancelled" : booking ? "Booked" : "Open"}
                        </span>
                      </div>
                      {booking && !cancelled && (
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-amber-200 pt-2 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{booking.player_name}</p>
                            <p className="text-xs text-black/60">Code {booking.booking_code}</p>
                          </div>
                          <a
                            href={whatsappUrl(booking.player_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-lg bg-emerald-700 px-2.5 py-1 text-xs font-medium text-white"
                          >
                            WhatsApp player
                          </a>
                        </div>
                      )}
                      {!cancelled && (
                        <form action={cancelSlot} className="mt-2 flex justify-end">
                          <input type="hidden" name="venue_id" value={id} />
                          <input type="hidden" name="slot_id" value={s.id} />
                          <CancelSlotButton booked={!!booking} />
                        </form>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
      </section>

      {/* Add a slot */}
      <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add a slot</h2>
        {courts.length === 0 ? (
          <p className="text-sm text-black/60">Add a court first (below).</p>
        ) : (
          <SlotForm
            key={date}
            venueId={id}
            date={date}
            dateLabel={date === today ? `today, ${formatDay(date)}` : formatDay(date)}
            courts={courts}
            lastNormalPrice={lastSlot ? Number(lastSlot.normal_price) : null}
            suggestedStart={suggestedStart}
          />
        )}
      </section>

      <details className="rounded-2xl border border-black/10 bg-white p-4">
        <summary className="cursor-pointer font-semibold">Courts ({courts.length})</summary>
        <div className="mt-3">
          <CourtsPanel venueId={id} courts={courts} />
        </div>
      </details>
    </main>
  );
}
