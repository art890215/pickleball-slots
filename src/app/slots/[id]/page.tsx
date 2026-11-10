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
      <Link href="/slots" className="text-sm text-emerald-700">← All slots</Link>

      <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="bg-emerald-700 p-4 text-white">
          <p className="text-sm text-white/80">{formatDay(hkDate(slot.starts_at))}</p>
          <p className="text-3xl font-bold tabular-nums">
            {hkTime(slot.starts_at)}–{hkTime(slot.ends_at)}
          </p>
          <p className="text-sm text-white/80">
            {hours % 1 ? hours.toFixed(1) : hours} hour{hours === 1 ? "" : "s"} · {slot.court_name}
          </p>
        </div>
        <div className="flex items-end justify-between p-4">
          <div>
            <p className="text-sm text-black/60">You pay</p>
            <p className="text-2xl font-bold text-emerald-800">HK${price}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-black/40 line-through">HK${Number(slot.normal_price)}</p>
            <p className="rounded-md bg-emerald-100 px-2 py-0.5 text-sm font-semibold text-emerald-900">{rate}% off</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-4">
        <div className="flex gap-3">
          <VenueBadge name={slot.venue_name} size={44} />
          <div className="min-w-0">
            <h1 className="font-semibold leading-snug">{slot.venue_name}</h1>
            <p className="text-sm text-black/60">{slot.address}</p>
            <p className="text-xs text-black/50">{slot.district} · {slot.region}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <a href={googleMapsUrl(slot.venue_name, slot.address)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/15 px-3 py-1.5">📍 Map</a>
          {slot.venue_instagram && (
            <a href={instagramUrl(slot.venue_instagram)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/15 px-3 py-1.5">Instagram</a>
          )}
          {slot.venue_whatsapp && (
            <a href={whatsappUrl(slot.venue_whatsapp)} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-black/15 px-3 py-1.5">WhatsApp venue</a>
          )}
        </div>
      </section>

      {!slot.is_available ? (
        <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
          <p className="font-semibold">This slot has just been taken</p>
          <Link href="/slots" className="mt-2 inline-block text-sm text-emerald-700 underline">See other slots</Link>
        </div>
      ) : !user ? (
        <section className="space-y-2 rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/70">Log in to book. Your booking code is emailed to you.</p>
          <Link href={`/signup?next=/slots/${id}`} className="block rounded-lg bg-emerald-700 px-4 py-3 text-center font-medium text-white">
            Create an account to book
          </Link>
          <Link href={`/login?next=/slots/${id}`} className="block rounded-lg border border-black/15 px-4 py-3 text-center font-medium">
            I already have an account
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-black/10 bg-white p-4">
          <h2 className="mb-3 font-semibold">Book this slot</h2>
          <BookForm slotId={id} price={price} defaultName={profile?.full_name ?? ""} defaultPhone={profile?.phone ?? ""} />
        </section>
      )}
    </main>
  );
}
