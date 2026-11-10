"use client";

import { useActionState, useState } from "react";
import { bookSlot } from "./actions";
import { ErrorBox, Field, buttonClass, inputClass } from "@/components/ui";

export function BookForm({ slotId, price, defaultName, defaultPhone }: { slotId: string; price: number; defaultName: string; defaultPhone: string }) {
  const [state, action, pending] = useActionState(bookSlot, undefined);
  const [agree, setAgree] = useState(false);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="slot_id" value={slotId} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Your name">
          <input name="full_name" defaultValue={defaultName} autoComplete="name" required className={inputClass} />
        </Field>
        <Field label="Mobile">
          <input name="phone" type="tel" inputMode="tel" defaultValue={defaultPhone} autoComplete="tel" required className={inputClass} />
        </Field>
      </div>

      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
        <p className="font-semibold">How payment works</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Pay <b>HK${price}</b> to the venue by FPS or PayMe <b>within 1 hour</b> (or before the slot starts, if sooner).</li>
          <li>Unpaid bookings are released automatically.</li>
          <li>You can cancel for free <b>before you pay</b>. <b>Payments are non-refundable.</b></li>
          <li>If the venue has to cancel, they refund you in full.</li>
        </ul>
        <label className="mt-2 flex items-start gap-2 font-medium">
          <input type="checkbox" name="agree" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 accent-emerald-700" />
          I agree to these payment rules
        </label>
      </div>

      <ErrorBox message={state?.error} />
      <button disabled={pending || !agree} className={buttonClass}>
        {pending ? "Booking…" : `Book for HK$${price}`}
      </button>
    </form>
  );
}
