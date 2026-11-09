import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { googleMapsUrl, instagramUrl, whatsappUrl } from "@/lib/venue-links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pickleball courts in Hong Kong | Pickleball Slots HK" };

const REGIONS = ["Hong Kong Island", "Kowloon", "New Territories"] as const;

type Venue = {
  id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  whatsapp: string | null;
  instagram: string | null;
  opening_hours: string | null;
  website: string | null;
  is_claimed: boolean;
};

export default async function CourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;
  const activeRegion = REGIONS.find((r) => r === region);

  const supabase = await createClient();
  let query = supabase
    .from("venues")
    .select("id, name, address, district, region, whatsapp, instagram, opening_hours, website, is_claimed")
    .eq("status", "approved")
    .order("is_claimed", { ascending: false })
    .order("district")
    .order("name");
  if (activeRegion) query = query.eq("region", activeRegion);
  const { data, error } = await query;
  const venues = (data ?? []) as Venue[];

  const chip = (label: string, href: string, active: boolean) => (
    <Link
      key={label}
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
        active ? "border-emerald-700 bg-emerald-700 text-white" : "border-black/15 bg-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <main className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Pickleball courts in Hong Kong</h1>
        <p className="mt-1 text-sm text-black/70">
          {venues.length} private venues{activeRegion ? ` in ${activeRegion}` : ""}.
        </p>
      </div>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chip("All", "/courts", !activeRegion)}
        {REGIONS.map((r) => chip(r, `/courts?region=${encodeURIComponent(r)}`, activeRegion === r))}
      </nav>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          Couldn&apos;t load courts: {error.message}
        </p>
      )}

      <ul className="space-y-3">
        {venues.map((v) => (
          <li key={v.id} className="rounded-xl border border-black/10 bg-white p-4">
            <div className="flex gap-3">
              <VenueBadge name={v.name} />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold leading-snug">{v.name}</h2>
                <p className="text-sm text-black/60">
                  {v.district} · {v.region}
                </p>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    v.is_claimed ? "bg-emerald-100 text-emerald-900" : "bg-black/5 text-black/60"
                  }`}
                >
                  {v.is_claimed ? "On Pickleball Slots HK" : "Not taking bookings here yet"}
                </span>
              </div>
            </div>

            <dl className="mt-3 space-y-1 text-sm">
              <div>
                <dt className="sr-only">Address</dt>
                <dd>{v.address}</dd>
              </div>
              {v.opening_hours && (
                <div>
                  <dt className="inline text-black/60">Hours: </dt>
                  <dd className="inline">{v.opening_hours}</dd>
                </div>
              )}
            </dl>

            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a
                href={googleMapsUrl(v.name, v.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-black/15 px-3 py-1.5"
              >
                📍 Map
              </a>
              {v.instagram && (
                <a
                  href={instagramUrl(v.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-black/15 px-3 py-1.5"
                >
                  Instagram
                </a>
              )}
              {v.whatsapp && (
                <a
                  href={whatsappUrl(v.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-black/15 px-3 py-1.5"
                >
                  WhatsApp
                </a>
              )}
              {v.website && (
                <a
                  href={v.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-black/15 px-3 py-1.5"
                >
                  Website
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="rounded-xl bg-black/[0.03] p-4 text-sm text-black/70">
        Details come from public sources and may change, so please check with the venue before
        you go. <strong>Own one of these venues?</strong>{" "}
        <Link href="/owner/signup" className="text-emerald-700 underline">
          Join to post discounted slots
        </Link>
        .
      </p>
    </main>
  );
}
