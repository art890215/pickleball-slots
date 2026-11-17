import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { formatDay, hkDate, hkTime, hoursBetween } from "@/lib/hk-time";
import { googleMapsUrl, instagramUrl, whatsappUrl } from "@/lib/venue-links";
import { BookForm } from "./book-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Book a slot | Pickleball Slots HK" };

type PublicSlot = {
  slot_id: string;
  starts_at: string;
  ends_at: string;
  normal_price: number;
  discounted_price: number;
  discount_rate: number | null;
  discount_pct: number;
  court_name: string;
  venue_name: string;
  address: string;
  district: string;
  region: string;
  venue_whatsapp: string | null;
  venue_instagram: string | null;
  opening_hours: string | null;
  is_available: boolean;
};

export default async function SlotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_slot", { p_slot_id: id });
  const slot = (data as PublicSlot[] | null)?.[0];
  if (!slot) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single()
    : { data: null };

  const price = Number(slot.discounted_price);
  const rate = slot.discount_rate ?? Math.round(Number(slot.discount_pct));
  const hours = hoursBetween(slot.starts_at, slot.ends_at);

  return (
    <main className="space-y-4">
      <Link href="/slots" className="text-sm font-semibold text-navy-700">← All slots</Link>

      <section className="overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm">
        <div className="on-dark relative overflow-hidden bg-gradient-to-br from-navy-800 to-navy-950 p-4 text-white">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ball-400/20 blur-2xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-ball-400">{formatDay(hkDate(slot.starts_at))}</p>
          <p className="relative mt-1 font-display text-[2rem] font-black italic leading-none tabular-nums">
            {hkTime(slot.starts_at)}–{hkTime(slot.ends_at)}
          </p>
          <p className="relative mt-2 text-sm text-white/80">
            {hours % 1 ? hours.toFixed(1) : hours} hour{hours === 1 ? "" : "s"} · {slot.court_name}
          </p>
        </div>
        <div className="flex items-end justify-between p-4">
          <div>
            <p className="text-sm text-navy-950/60">You pay</p>
            <p className="font-display text-3xl font-black italic leading-tight text-navy-900">HK${price}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-navy-950/40 line-through">HK${Number(slot.normal_price)}</p>
            <p className="mt-1 inline-block rounded-md bg-ball-400 px-2.5 py-1 font-display text-sm font-extrabold italic text-navy-900">{rate}% off</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-navy-900/10 bg-white p-4">
        <div className="flex gap-3">
          <VenueBadge name={slot.venue_name} size={44} />
          <div className="min-w-0">
            <h1 className="font-sans text-base font-semibold normal-case not-italic leading-snug">{slot.venue_name}</h1>
            <p className="text-sm text-navy-950/60">{slot.address}</p>
            <p className="text-xs text-navy-950/50">{slot.district} · {slot.region}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href={googleMapsUrl(slot.venue_name, slot.address)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-navy-900/15 px-3 py-1.5">📍 Map</a>
          {slot.venue_instagram && (
            <a href={instagramUrl(slot.venue_instagram)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-navy-900/15 px-3 py-1.5">Instagram</a>
          )}
          {slot.venue_whatsapp && (
            <a href={whatsappUrl(slot.venue_whatsapp)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-navy-900/15 px-3 py-1.5">WhatsApp venue</a>
          )}
        </div>
      </section>

      {!slot.is_available ? (
        <div className="rounded-2xl border border-navy-900/10 bg-white p-4 text-center">
          <p className="font-semibold">
            {new Date(slot.starts_at).getTime() - Date.now() < 30 * 60000
              ? "Booking has closed for this slot"
              : "This slot has just been taken"}
          </p>
          {new Date(slot.starts_at).getTime() - Date.now() < 30 * 60000 && (
            <p className="mt-1 text-sm text-navy-950/60">Slots can be booked until 30 minutes before they start.</p>
          )}
          <Link href="/slots" className="mt-2 inline-block text-sm text-navy-700 underline">See other slots</Link>
        </div>
      ) : !user ? (
        <section className="space-y-2 rounded-2xl border border-navy-900/10 bg-white p-4">
          <p className="text-sm text-navy-950/70">Log in to book. Your booking code is emailed to you.</p>
          <Link href={`/signup?next=/slots/${id}`} className="block rounded-xl bg-navy-900 px-4 py-3.5 text-center font-display font-extrabold uppercase italic tracking-wide text-white shadow-[0_3px_0_0_var(--color-ball-400)] transition active:translate-y-[2px] active:shadow-none">
            Create an account to book
          </Link>
          <Link href={`/login?next=/slots/${id}`} className="block rounded-lg border border-navy-900/15 px-4 py-3 text-center font-medium">
            I already have an account
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-navy-900/10 bg-white p-4">
          <h2 className="mb-3 font-semibold">Book this slot</h2>
          <BookForm slotId={id} price={price} defaultName={profile?.full_name ?? ""} defaultPhone={profile?.phone ?? ""} />
        </section>
      )}
    </main>
  );
}
