"use client";

import { useActionState } from "react";
import { savePaymentDetails } from "./actions";
import { ErrorBox, Field, NoticeBox, buttonClass, inputClass } from "@/components/ui";

export function PaymentForm({
  venueId,
  initial,
}: {
  venueId: string;
  initial: { fps_id: string | null; payme_id: string | null; account_name: string } | null;
}) {
  const [state, action, pending] = useActionState(savePaymentDetails, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="venue_id" value={venueId} />
      <p className="text-sm text-black/60">
        Players pay you directly. After booking, they see these details (text only, no payment link) and must pay within
        1 hour, using their booking code as the reference. Only players with a booking can see them.
      </p>
      <Field label="FPS ID, phone number or email" hint="Leave empty if you only use PayMe">
        <input name="fps_id" defaultValue={initial?.fps_id ?? ""} inputMode="text" className={inputClass} />
      </Field>
      <Field label="PayMe phone number or PayCode name" hint="Leave empty if you only use FPS">
        <input name="payme_id" defaultValue={initial?.payme_id ?? ""} className={inputClass} />
      </Field>
      <Field label="Account name players will see" hint="So players can check they're paying the right account">
        <input name="account_name" defaultValue={initial?.account_name ?? ""} required className={inputClass} />
      </Field>
      <ErrorBox message={state?.error} />
      <NoticeBox message={state?.ok} />
      <button disabled={pending} className={buttonClass}>{pending ? "Saving…" : "Save payment details"}</button>
    </form>
  );
}
