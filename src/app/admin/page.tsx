import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { googleMapsUrl, whatsappUrl } from "@/lib/venue-links";
import { createClaimLink, setVenueStatus } from "./actions";
import { CopyButton } from "./copy-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | Pickleball Slots HK", robots: { index: false } };

type Venue = {
  id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  whatsapp: string | null;
  instagram: string | null;
  contact_email: string | null;
  applicant_title: string | null;
  status: string;
  is_claimed: boolean;
  created_at: string;
  venue_claims: { token: string; used_at: string | null } | { token: string; used_at: string | null }[] | null;
};

function claimOf(v: Venue) {
  const c = Array.isArray(v.venue_claims) ? v.venue_claims[0] : v.venue_claims;
  return c ?? null;
}

const smallBtn = "rounded-lg border border-black/15 px-3 py-1.5 text-sm";
const greenBtn = "rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white";

function StatusButton({ id, status, label, className }: { id: string; status: string; label: string; className: string }) {
  return (
    <form action={setVenueStatus}>
      <input type="hidden" name="venue_id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={className}>{label}</button>
    </form>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/owner/login?next=/admin");

  const { data: me } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  if (!me?.is_platform_admin) {
    return (
      <main className="space-y-2">
        <h1 className="text-xl font-semibold">Admins only</h1>
        <p className="text-sm text-black/70">This page is for the platform admin.</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("venues")
    .select(
      "id, name, address, district, region, whatsapp, instagram, contact_email, applicant_title, status, is_claimed, created_at, venue_claims(token, used_at)",
    )
    .order("name");
  const venues = (data ?? []) as Venue[];

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  const applications = venues.filter((v) => v.is_claimed && v.status === "pending");
  const hidden = venues.filter((v) => !v.is_claimed && v.status === "pending");
  const unclaimed = venues.filter((v) => !v.is_claimed && v.status === "approved");
  const claimedCount = venues.filter((v) => v.is_claimed && v.status === "approved").length;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-black/70">
          {claimedCount} venues joined · {unclaimed.length} listed but not claimed · {hidden.length} hidden ·{" "}
          {applications.length} waiting for approval
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Owner applications ({applications.length})</h2>
        {applications.length === 0 && <p className="text-sm text-black/60">None waiting.</p>}
        {applications.map((v) => (
          <div key={v.id} className="space-y-2 rounded-xl border border-black/10 bg-white p-4">
            <div className="flex gap-3">
              <VenueBadge name={v.name} size={40} />
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{v.name}</p>
                <p className="text-black/60">{v.address} · {v.district}</p>
                <p>WhatsApp {v.whatsapp} · @{v.instagram} · {v.contact_email}</p>
                <p className="text-black/60">Applicant title: {v.applicant_title}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusButton id={v.id} status="approved" label="Approve" className={greenBtn} />
              <StatusButton id={v.id} status="rejected" label="Reject" className={smallBtn} />
              <a href={googleMapsUrl(v.name, v.address)} target="_blank" rel="noopener noreferrer" className={smallBtn}>
                📍 Map
              </a>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Claim links ({unclaimed.length})</h2>
        <p className="text-sm text-black/60">
          Send each venue its private link. Once they claim it, the venue is theirs and goes live
          straight away. Anyone with a link can claim that venue, so only send it to the owner.
        </p>
        {unclaimed.map((v) => {
          const claim = claimOf(v);
          const link = claim ? `${origin}/claim/${claim.token}` : null;
          const message = link
            ? `Hi ${v.name}! Your venue is listed on Pickleball Slots HK. Claim your free listing here to post discounted slots and fill empty court time: ${link}`
            : "";
          return (
            <details key={v.id} className="rounded-xl border border-black/10 bg-white p-3">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <VenueBadge name={v.name} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.name}</span>
                <span className="text-xs text-black/50">{v.district}</span>
              </summary>
              <div className="mt-3 space-y-2 text-sm">
                {link ? (
                  <>
                    <p className="break-all rounded-lg bg-black/[0.03] px-2 py-1.5 font-mono text-xs">{link}</p>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton text={link} />
                      <CopyButton text={message} label="Copy message" />
                      {v.whatsapp && (
                        <a href={whatsappUrl(v.whatsapp, message)} target="_blank" rel="noopener noreferrer" className={greenBtn}>
                          Send on WhatsApp
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <form action={createClaimLink}>
                    <input type="hidden" name="venue_id" value={v.id} />
                    <button className={greenBtn}>Create claim link</button>
                  </form>
                )}
                <div className="flex flex-wrap gap-2">
                  <StatusButton id={v.id} status="pending" label="Hide from directory" className={smallBtn} />
                </div>
              </div>
            </details>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Hidden listings ({hidden.length})</h2>
        <p className="text-sm text-black/60">
          Imported venues that need checking first (see the &ldquo;Please Check&rdquo; column in the venue
          spreadsheet). Show them once you&apos;ve confirmed the details.
        </p>
        {hidden.map((v) => (
          <div key={v.id} className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-3">
            <VenueBadge name={v.name} size={32} />
            <span className="min-w-0 flex-1 truncate text-sm">{v.name}</span>
            <StatusButton id={v.id} status="approved" label="Show" className={smallBtn} />
          </div>
        ))}
      </section>

      <p className="text-center text-sm">
        <Link href="/courts" className="text-emerald-700 underline">
          View the public directory
        </Link>
      </p>
    </main>
  );
}
