import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "./actions";
import { VenueForm } from "./venue-form";
import { googleMapsUrl, instagramUrl } from "@/lib/venue-links";

export const dynamic = "force-dynamic";

type Venue = {
  id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  whatsapp: string;
  instagram: string | null;
  contact_email: string | null;
  applicant_title: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
};

const statusText: Record<
  Venue["status"],
  { label: string; note: string; className: string }
> = {
  pending: {
    label: "Waiting for approval",
    note: "We're reviewing your venue. You'll be able to add slots once it's approved.",
    className: "bg-amber-100 text-amber-900",
  },
  approved: {
    label: "Approved",
    note: "Your venue is live. Adding slots is the next feature we're building.",
    className: "bg-emerald-100 text-emerald-900",
  },
  rejected: {
    label: "Not approved",
    note: "Please contact us on WhatsApp if you think this is a mistake.",
    className: "bg-red-100 text-red-900",
  },
  suspended: {
    label: "Suspended",
    note: "Your venue is hidden from players. Please contact us.",
    className: "bg-red-100 text-red-900",
  },
};

export default async function OwnerHomePage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { claimed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/owner/login");

  const [{ data: profile }, { data: links }, { data: districts }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single(),
      supabase
        .from("venue_admins")
        .select(
          "venue:venues(id, name, address, district, region, whatsapp, instagram, contact_email, applicant_title, status)",
        )
        .eq("user_id", user.id),
      supabase
        .from("districts")
        .select("name, region")
        .order("region")
        .order("name"),
    ]);

  const venues = (links ?? [])
    .map((l) => l.venue as unknown as Venue | null)
    .filter((v): v is Venue => v !== null);

  return (
    <main className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Hi {profile?.full_name ?? "there"}
          </h1>
          <p className="text-sm text-black/60">{user.email}</p>
        </div>
        <form action={logOut}>
          <button className="rounded-lg border border-black/15 px-3 py-1.5 text-sm">
            Log out
          </button>
        </form>
      </div>

      {claimed && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          🎉 Your venue is now yours to manage. Thanks for joining!
        </p>
      )}

      {venues.length === 0 ? (
        <>
          <p className="text-sm text-black/70">
            Tell us about your venue. Once we approve it, you can start posting
            discounted slots.
          </p>
          <VenueForm
            districts={districts ?? []}
            defaultName={profile?.full_name ?? ""}
            defaultPhone={profile?.phone ?? ""}
            defaultEmail={user.email ?? ""}
          />
        </>
      ) : (
        venues.map((v) => {
          const s = statusText[v.status];
          return (
            <section
              key={v.id}
              className="space-y-3 rounded-xl border border-black/10 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{v.name}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}
                >
                  {s.label}
                </span>
              </div>
              <dl className="space-y-1 text-sm">
                <div>
                  <dt className="inline text-black/60">Address: </dt>
                  <dd className="inline">{v.address}</dd>
                </div>
                <div>
                  <dt className="inline text-black/60">District: </dt>
                  <dd className="inline">
                    {v.district} ({v.region})
                  </dd>
                </div>
                <div>
                  <dt className="inline text-black/60">WhatsApp: </dt>
                  <dd className="inline">{v.whatsapp}</dd>
                </div>
                {v.instagram && (
                  <div>
                    <dt className="inline text-black/60">Instagram: </dt>
                    <dd className="inline">
                      <a
                        href={instagramUrl(v.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline"
                      >
                        @{v.instagram}
                      </a>
                    </dd>
                  </div>
                )}
                {v.contact_email && (
                  <div>
                    <dt className="inline text-black/60">Email: </dt>
                    <dd className="inline break-all">{v.contact_email}</dd>
                  </div>
                )}
                {v.applicant_title && (
                  <div>
                    <dt className="inline text-black/60">Applied by: </dt>
                    <dd className="inline">
                      {profile?.full_name}, {v.applicant_title}
                    </dd>
                  </div>
                )}
              </dl>
              <a
                href={googleMapsUrl(v.name, v.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium text-emerald-700 underline"
              >
                📍 Open in Google Maps ↗
              </a>
              <p className="text-sm text-black/70">{s.note}</p>
            </section>
          );
        })
      )}
    </main>
  );
}
