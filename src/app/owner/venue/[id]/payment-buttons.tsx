"use client";

import { useActionState, useState } from "react";
import { confirmPayment, markCourtUnavailable, rejectPayment } from "./actions";
import { ErrorBox, NoticeBox } from "@/components/ui";

export function PaymentButtons({ venueId, bookingId, code, reported }: { venueId: string; bookingId: string; code: string; reported: boolean }) {
  const [okState, okAction, okPending] = useActionState(confirmPayment, undefined);
  const [noState, noAction, noPending] = useActionState(rejectPayment, undefined);
  const [blocked, setBlocked] = useState(false);
  return (
    <div className="mt-2 space-y-2 rounded-lg bg-white/70 p-2">
      <p className="text-xs text-black/70">
        {reported ? "The player says they've paid." : "Waiting for the player to pay."} Check your FPS / PayMe for reference{" "}
        <b className="font-mono">{code}</b>.
      </p>
      <form action={okAction} id={`ok-${bookingId}`} className="space-y-2">
        <input type="hidden" name="venue_id" value={venueId} />
        <input type="hidden" name="booking_id" value={bookingId} />
        <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs font-medium text-amber-950">
          <input
            type="checkbox"
            name="court_blocked"
            checked={blocked}
            onChange={(e) => setBlocked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-700"
          />
          I&apos;ve blocked this court and time in my own booking system
        </label>
      </form>
      <div className="grid grid-cols-2 gap-2">
        <button
          form={`ok-${bookingId}`}
          disabled={okPending || noPending || !blocked}
          className="w-full rounded-lg bg-emerald-700 px-2 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {okPending ? "…" : "Payment received"}
        </button>
        <form
          action={noAction}
          onSubmit={(e) => {
            if (!window.confirm(`Payment for ${code} not received? The booking will be cancelled and the slot reopened.`)) e.preventDefault();
          }}
        >
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

// For a clash: the court was sold elsewhere or can't be used.
export function CourtUnavailableButton({ venueId, bookingId, paid }: { venueId: string; bookingId: string; paid: boolean }) {
  const [state, action, pending] = useActionState(markCourtUnavailable, undefined);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const msg = paid
          ? "Court not available? The booking will be cancelled and you must REFUND the player in full. The slot can't be posted again."
          : "Court not available? The booking will be cancelled and the player told. The slot can't be posted again.";
        if (!window.confirm(msg)) e.preventDefault();
      }}
      className="mt-2 space-y-1"
    >
      <input type="hidden" name="venue_id" value={venueId} />
      <input type="hidden" name="booking_id" value={bookingId} />
      <ErrorBox message={state?.error} />
      <NoticeBox message={state?.ok} />
      <div className="flex justify-end">
        <button disabled={pending} className="text-xs font-medium text-red-700 underline disabled:opacity-50">
          {pending ? "Cancelling…" : "Court not available?"}
        </button>
      </div>
    </form>
  );
}
