import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logOut } from "./actions";
import { VenueForm } from "./venue-form";

export const dynamic = "force-dynamic";

type Venue = {
  id: string;
  name: string;
  address: string;
  district: string;
  region: string;
  whatsapp: string;
  status: "pending" | "approved" | "rejected" | "suspended";
};

const statusText: Record<Venue["status"], { label: string; note: string; className: string }> = {
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

export default async function OwnerHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/owner/login");

  const [{ data: profile }, { data: links }, { data: districts }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    supabase
      .from("venue_admins")
      .select("venue:venues(id, name, address, district, region, whatsapp, status)")
      .eq("user_id", user.id),
    supabase.from("districts").select("name, region").order("region").order("name"),
  ]);

  const venues = (links ?? [])
    .map((l) => l.venue as unknown as Venue | null)
    .filter((v): v is Venue => v !== null);

  return (
    <main className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Hi {profile?.full_name ?? "there"}</h1>
          <p className="text-sm text-black/60">{user.email}</p>
        </div>
        <form action={logOut}>
          <button className="rounded-lg border border-black/15 px-3 py-1.5 text-sm">Log out</button>
        </form>
      </div>

      {venues.length === 0 ? (
        <>
          <p className="text-sm text-black/70">
            Tell us about your venue. Once we approve it, you can start posting discounted slots.
          </p>
          <VenueForm
            districts={districts ?? []}
            defaultName={profile?.full_name ?? ""}
            defaultPhone={profile?.phone ?? ""}
          />
        </>
      ) : (
        venues.map((v) => {
          const s = statusText[v.status];
          return (
            <section key={v.id} className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{v.name}</h2>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
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
              </dl>
              <p className="text-sm text-black/70">{s.note}</p>
            </section>
          );
        })
      )}
    </main>
  );
}
