"use client";

import { useActionState } from "react";
import { confirmPayment, rejectPayment } from "./actions";
import { ErrorBox } from "@/components/ui";

export function PaymentButtons({ venueId, bookingId, code, reported }: { venueId: string; bookingId: string; code: string; reported: boolean }) {
  const [okState, okAction, okPending] = useActionState(confirmPayment, undefined);
  const [noState, noAction, noPending] = useActionState(rejectPayment, undefined);
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-white/70 p-2">
      <p className="text-xs text-black/70">
        {reported ? "The player says they've paid." : "Waiting for the player to pay."} Check your FPS / PayMe for reference{" "}
        <b className="font-mono">{code}</b>.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <form action={okAction} onSubmit={(e) => { if (!window.confirm(`Confirm you received payment for ${code}? The slot will be locked.`)) e.preventDefault(); }}>
          <input type="hidden" name="venue_id" value={venueId} />
          <input type="hidden" name="booking_id" value={bookingId} />
          <button disabled={okPending || noPending} className="w-full rounded-lg bg-emerald-700 px-2 py-2 text-sm font-medium text-white disabled:opacity-50">
            {okPending ? "…" : "Payment received"}
          </button>
        </form>
        <form action={noAction} onSubmit={(e) => { if (!window.confirm(`Payment for ${code} not received? The booking will be cancelled and the slot reopened.`)) e.preventDefault(); }}>
          <input type="hidden" name="venue_id" value={venueId} />
          <input type="hidden" name="booking_id" value={bookingId} />
          <button disabled={okPending || noPending} className="w-full rounded-lg border border-black/15 bg-white px-2 py-2 text-sm font-medium text-red-700 disabled:opacity-50">
            {noPending ? "…" : "Not received"}
          </button>
        </form>
      </div>
      <ErrorBox message={okState?.error ?? noState?.error} />
    </div>
  );
}
