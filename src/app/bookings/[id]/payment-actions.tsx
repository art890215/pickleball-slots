"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { cancelMyBooking, reportPaid } from "./actions";
import { ErrorBox, buttonClass } from "@/components/ui";

// Live "Pay within 52:10" countdown. Refreshes the page when time runs out.
export function Countdown({ dueAt }: { dueAt: string }) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, new Date(dueAt).getTime() - now);
  useEffect(() => {
    if (left === 0) router.refresh();
  }, [left, router]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const urgent = left < 10 * 60000;
  return (
    <div className={`rounded-xl p-3 text-center ${urgent ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900"}`}>
      <p className="text-xs font-medium uppercase tracking-wide">Pay within</p>
      <p className="text-3xl font-bold tabular-nums">
        {m}:{String(s).padStart(2, "0")}
      </p>
      <p className="text-xs">or the slot is released</p>
    </div>
  );
}

export function PaidButton({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(reportPaid, undefined);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Have you sent the payment? Payments are non-refundable.")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <ErrorBox message={state?.error} />
      <button disabled={pending} className={buttonClass}>{pending ? "Sending…" : "I've paid"}</button>
    </form>
  );
}

export function CancelButton({ bookingId }: { bookingId: string }) {
  const [state, action, pending] = useActionState(cancelMyBooking, undefined);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Cancel this booking? The slot will be released for others.")) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="booking_id" value={bookingId} />
      <ErrorBox message={state?.error} />
      <button disabled={pending} className="w-full rounded-lg border border-black/15 px-4 py-3 font-medium text-red-700">
        {pending ? "Cancelling…" : "Cancel booking (free, before paying)"}
      </button>
    </form>
  );
}
