"use client";

import { useActionState, useState } from "react";
import { applyVenue } from "./actions";
import { ErrorBox, Field, buttonClass, inputClass } from "@/components/ui";
import { googleMapsUrl } from "@/lib/venue-links";

type District = { name: string; region: string };

export function VenueForm({
  districts,
  defaultName,
  defaultPhone,
  defaultEmail,
}: {
  districts: District[];
  defaultName: string;
  defaultPhone: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(applyVenue, undefined);
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const regions = [...new Set(districts.map((d) => d.region))];
  const canCheckMap = venueName.trim().length > 1 && address.trim().length > 3;

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">About you</legend>
        <Field label="Your name">
          <input name="full_name" defaultValue={defaultName} required className={inputClass} />
        </Field>
        <Field label="Your job title" hint="e.g. Owner, Manager, Operations Lead">
          <input name="applicant_title" autoComplete="organization-title" required className={inputClass} />
        </Field>
        <Field label="Your mobile number" hint="Hong Kong number, e.g. 9123 4567">
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={defaultPhone}
            required
            className={inputClass}
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Your venue</legend>
        <Field label="Venue name">
          <input
            name="venue_name"
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Full address">
          <input
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
            required
            className={inputClass}
          />
        </Field>
        <div className="rounded-lg bg-black/[0.03] px-3 py-2 text-sm">
          {canCheckMap ? (
            <a
              href={googleMapsUrl(venueName, address)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-emerald-700 underline"
            >
              📍 Check on Google Maps ↗
            </a>
          ) : (
            <span className="text-black/60">
              📍 Enter the venue name and address to check the location on Google Maps.
            </span>
          )}
          <p className="mt-1 text-xs text-black/60">
            Players will get this map link. If it finds the wrong place, add more detail to the
            address (building, street number).
          </p>
        </div>
        <Field label="District" hint="The region (HK Island / Kowloon / NT) is set automatically">
          <select name="district" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a district
            </option>
            {regions.map((region) => (
              <optgroup key={region} label={region}>
                {districts
                  .filter((d) => d.region === region)
                  .map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Venue WhatsApp number" hint="Players will see this to contact the venue">
          <input name="whatsapp" type="tel" inputMode="tel" required className={inputClass} />
        </Field>
        <Field label="Venue Instagram account" hint="e.g. @tsuenwanpickle">
          <input
            name="instagram"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="@"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Venue email address">
          <input
            name="contact_email"
            type="email"
            autoComplete="email"
            defaultValue={defaultEmail}
            required
            className={inputClass}
          />
        </Field>
      </fieldset>

      <ErrorBox message={state?.error} />
      <button disabled={pending} className={buttonClass}>
        {pending ? "Submitting…" : "Submit venue for approval"}
      </button>
    </form>
  );
}
