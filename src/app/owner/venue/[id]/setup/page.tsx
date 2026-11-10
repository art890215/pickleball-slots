import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { DetailsForm } from "./details-form";
import { CourtsSetup } from "./courts-setup";
import { PriceListEditor } from "./price-list-editor";
import { PaymentForm } from "./payment-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up your venue | Pickleball Slots HK", robots: { index: false } };

function Step({ n, title, done, children, open }: { n: number; title: string; done: boolean; children: React.ReactNode; open: boolean }) {
  return (
    <details open={open} className="group rounded-2xl border border-black/10 bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            done ? "bg-emerald-700 text-white" : "border-2 border-black/20 text-black/60"
          }`}
        >
          {done ? "✓" : n}
        </span>
        <span className="flex-1 font-semibold">{title}</span>
        <span className="text-black/40 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-black/10 p-4">{children}</div>
    </details>
  );
}

export default async function SetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { id } = await params;
  const { claimed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/owner/login?next=/owner/venue/${id}/setup`);

  const { data: link } = await supabase.from("venue_admins").select("venue_id").eq("user_id", user.id).eq("venue_id", id).maybeSingle();
  if (!link) notFound();

  const [{ data: venue }, { data: courts }, { data: rules }, { data: districts }, { data: payment }] = await Promise.all([
    supabase.from("venues").select("id, name, address, district, opening_hours, whatsapp, instagram, contact_email, website").eq("id", id).single(),
    supabase.from("courts").select("id, name").eq("venue_id", id).order("name"),
    supabase.from("venue_price_rules").select("days, start_time, end_time, price_per_hour").eq("venue_id", id).order("created_at"),
    supabase.from("districts").select("name, region").order("region").order("name"),
    supabase.from("venue_payment_details").select("fps_id, payme_id, account_name").eq("venue_id", id).maybeSingle(),
  ]);
  if (!venue) notFound();

  const detailsDone = !!(venue.whatsapp && venue.instagram && venue.contact_email && venue.address !== "Address to be confirmed");
  const courtsDone = (courts ?? []).length > 0;
  const pricesDone = (rules ?? []).length > 0;
  const paymentDone = !!payment;
  const allDone = detailsDone && courtsDone && pricesDone && paymentDone;
  const firstOpen = !detailsDone ? 1 : !pricesDone ? 3 : !paymentDone ? 4 : 0;

  return (
    <main className="space-y-4">
      <div className="flex items-center gap-3">
        <VenueBadge name={venue.name} size={44} />
        <div className="min-w-0">
          <Link href="/owner" className="text-xs text-emerald-700">← My venue</Link>
          <h1 className="truncate text-lg font-semibold leading-tight">Set up {venue.name}</h1>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950">
        {claimed && <strong className="mb-1 block">🎉 {venue.name} is now yours. Welcome!</strong>}
        {allDone
          ? "All set! You can change these any time."
          : "Four quick steps before players can book. We filled in what we found online, so please check it's right."}
      </div>

      <Step n={1} title="Check your venue details" done={detailsDone} open={firstOpen === 1}>
        <DetailsForm venue={venue} districts={districts ?? []} />
      </Step>
      <Step n={2} title={`Courts (${(courts ?? []).length})`} done={courtsDone} open={false}>
        <CourtsSetup venueId={id} courts={courts ?? []} />
      </Step>
      <Step n={3} title="Your original prices" done={pricesDone} open={firstOpen === 3}>
        <p className="mb-3 text-sm text-black/60">
          Enter your normal court prices for each day and time. When you post a slot, its original price is filled in
          from this list, and the discount is taken off.
        </p>
        <PriceListEditor venueId={id} initial={(rules ?? []).map((r) => ({ ...r, price_per_hour: Number(r.price_per_hour) }))} />
      </Step>

      <Step n={4} title="How players pay you" done={paymentDone} open={firstOpen === 4}>
        <PaymentForm venueId={id} initial={payment ?? null} />
      </Step>

      <Link
        href={`/owner/venue/${id}`}
        className={`block rounded-lg px-4 py-3 text-center font-medium ${
          allDone ? "bg-emerald-700 text-white" : "border border-black/15 bg-white text-black/70"
        }`}
      >
        {allDone ? "Post slots →" : "Skip for now → Manage slots"}
      </Link>
    </main>
  );
}
