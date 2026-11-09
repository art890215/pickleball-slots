"use client";

import { useActionState } from "react";
import { claimVenue } from "./actions";
import { ErrorBox, Field, buttonClass, inputClass } from "@/components/ui";

export function ClaimForm(props: {
  token: string;
  defaultName: string;
  defaultPhone: string;
  whatsapp: string;
  instagram: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(claimVenue, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={props.token} />
      <fieldset className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">About you</legend>
        <Field label="Your name">
          <input name="full_name" defaultValue={props.defaultName} required className={inputClass} />
        </Field>
        <Field label="Your job title" hint="e.g. Owner, Manager, Operations Lead">
          <input name="applicant_title" required className={inputClass} />
        </Field>
        <Field label="Your mobile number" hint="Hong Kong number, e.g. 9123 4567">
          <input name="phone" type="tel" inputMode="tel" defaultValue={props.defaultPhone} required className={inputClass} />
        </Field>
      </fieldset>
      <fieldset className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
        <legend className="px-1 text-sm font-semibold">Venue contact details</legend>
        <p className="text-xs text-black/60">We filled in what we found online. Please check and correct.</p>
        <Field label="Venue WhatsApp number">
          <input name="whatsapp" type="tel" inputMode="tel" defaultValue={props.whatsapp} required className={inputClass} />
        </Field>
        <Field label="Venue Instagram account">
          <input
            name="instagram"
            defaultValue={props.instagram ? `@${props.instagram}` : ""}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="@"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Venue email address">
          <input name="contact_email" type="email" defaultValue={props.email} required className={inputClass} />
        </Field>
      </fieldset>
      <ErrorBox message={state?.error} />
      <button disabled={pending} className={buttonClass}>
        {pending ? "Claiming…" : "Claim this venue"}
      </button>
    </form>
  );
}
