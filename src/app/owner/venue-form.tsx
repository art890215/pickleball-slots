"use client";

import { useActionState } from "react";
import { applyVenue } from "./actions";
import { ErrorBox, Field, buttonClass, inputClass } from "@/components/ui";

type District = { name: string; region: string };

export function VenueForm({
  districts,
  defaultName,
  defaultPhone,
}: {
  districts: District[];
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, action, pending] = useActionState(applyVenue, undefined);
  const regions = [...new Set(districts.map((d) => d.region))];

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">About you</legend>
        <Field label="Your name">
          <input name="full_name" defaultValue={defaultName} required className={inputClass} />
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
          <input name="venue_name" required className={inputClass} />
        </Field>
        <Field label="Address">
          <input name="address" autoComplete="street-address" required className={inputClass} />
        </Field>
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
      </fieldset>

      <ErrorBox message={state?.error} />
      <button disabled={pending} className={buttonClass}>
        {pending ? "Submitting…" : "Submit venue for approval"}
      </button>
    </form>
  );
}
