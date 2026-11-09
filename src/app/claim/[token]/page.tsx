import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { VenueBadge } from "@/components/venue-badge";
import { ClaimForm } from "./claim-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Claim your venue | Pickleball Slots HK", robots: { index: false } };

type Claim = {
  venue_id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  whatsapp: string | null;
  instagram: string | null;
  contact_email: string | null;
  already_used: boolean;
};

export default async function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_claim", { p_token: token });
  const claim = (data as Claim[] | null)?.[0];

  if (!claim) {
    return (
      <main className="space-y-3">
        <h1 className="text-xl font-semibold">This link isn&apos;t valid</h1>
        <p className="text-sm text-black/70">
          Please check you copied the whole link, or contact us for a new one.
        </p>
      </main>
    );
  }

  const venueCard = (
    <div className="flex gap-3 rounded-xl border border-black/10 bg-white p-4">
      <VenueBadge name={claim.name} />
      <div className="min-w-0">
        <h2 className="font-semibold leading-snug">{claim.name}</h2>
        <p className="text-sm text-black/60">{claim.address}</p>
        <p className="text-sm text-black/60">
          {claim.district} · {claim.region}
        </p>
      </div>
    </div>
  );

  if (claim.already_used) {
    return (
      <main className="space-y-4">
        <h1 className="text-xl font-semibold">This venue has already been claimed</h1>
        {venueCard}
        <Link href="/owner/login" className="inline-block text-sm font-medium text-emerald-700 underline">
          Log in to manage it
        </Link>
      </main>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = `/claim/${token}`;

  if (!user) {
    return (
      <main className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Claim your venue</h1>
          <p className="mt-1 text-sm text-black/70">
            Your venue is listed on Pickleball Slots HK. Claim it to manage your listing and post
            discounted slots to fill empty court time.
          </p>
        </div>
        {venueCard}
        <div className="space-y-2">
          <Link
            href={`/owner/signup?next=${encodeURIComponent(next)}`}
            className="block w-full rounded-lg bg-emerald-700 px-4 py-3 text-center font-medium text-white"
          >
            Create an account to claim
          </Link>
          <Link
            href={`/owner/login?next=${encodeURIComponent(next)}`}
            className="block w-full rounded-lg border border-black/15 px-4 py-3 text-center font-medium"
          >
            I already have an account
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <main className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Claim your venue</h1>
        <p className="mt-1 text-sm text-black/70">Logged in as {user.email}</p>
      </div>
      {venueCard}
      <ClaimForm
        token={token}
        defaultName={profile?.full_name ?? ""}
        defaultPhone={profile?.phone ?? ""}
        whatsapp={claim.whatsapp ?? ""}
        instagram={claim.instagram ?? ""}
        email={claim.contact_email ?? ""}
      />
    </main>
  );
}
