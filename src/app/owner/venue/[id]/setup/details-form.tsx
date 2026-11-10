"use client";

import { useActionState } from "react";
import { saveVenueDetails } from "./actions";
import { ErrorBox, Field, NoticeBox, buttonClass, inputClass } from "@/components/ui";
import { googleMapsUrl } from "@/lib/venue-links";

type Venue = {
  id: string;
  name: string;
  address: string;
  district: string;
  opening_hours: string | null;
  whatsapp: string | null;
  instagram: string | null;
  contact_email: string | null;
  website: string | null;
};

export function DetailsForm({ venue, districts }: { venue: Venue; districts: { name: string; region: string }[] }) {
  const [state, action, pending] = useActionState(saveVenueDetails, undefined);
  const regions = [...new Set(districts.map((d) => d.region))];
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="venue_id" value={venue.id} />
      <Field label="Venue name">
        <input name="name" defaultValue={venue.name} required className={inputClass} />
      </Field>
      <Field label="Full address">
        <input name="address" defaultValue={venue.address === "Address to be confirmed" ? "" : venue.address} required className={inputClass} />
      </Field>
      <a href={googleMapsUrl(venue.name, venue.address)} target="_blank" rel="noopener noreferrer" className="-mt-2 inline-block text-sm text-emerald-700 underline">
        📍 Check the saved address on Google Maps ↗
      </a>
      <Field label="District">
        <select name="district" defaultValue={venue.district} required className={inputClass}>
          {regions.map((region) => (
            <optgroup key={region} label={region}>
              {districts.filter((d) => d.region === region).map((d) => (
                <option key={d.name}>{d.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </Field>
      <Field label="Opening hours" hint="Shown to players, e.g. Daily 07:00 – 23:00, or Open 24 hours">
        <input name="opening_hours" defaultValue={venue.opening_hours ?? ""} className={inputClass} />
      </Field>
      <Field label="WhatsApp number">
        <input name="whatsapp" type="tel" inputMode="tel" defaultValue={venue.whatsapp ?? ""} required className={inputClass} />
      </Field>
      <Field label="Instagram account">
        <input name="instagram" defaultValue={venue.instagram ? `@${venue.instagram}` : ""} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="@" required className={inputClass} />
      </Field>
      <Field label="Email" hint="Booking confirmations will be sent here">
        <input name="contact_email" type="email" defaultValue={venue.contact_email ?? ""} required className={inputClass} />
      </Field>
      <Field label="Website (optional)">
        <input name="website" type="url" inputMode="url" defaultValue={venue.website ?? ""} placeholder="https://" className={inputClass} />
      </Field>
      <ErrorBox message={state?.error} />
      <NoticeBox message={state?.ok} />
      <button disabled={pending} className={buttonClass}>{pending ? "Saving…" : "Save details"}</button>
    </form>
  );
}
