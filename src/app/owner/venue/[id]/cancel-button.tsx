"use client";

import { useFormStatus } from "react-dom";

// Asks before cancelling, because a booked slot also cancels the player's booking.
export function CancelSlotButton({ booked }: { booked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      onClick={(e) => {
        const msg = booked
          ? "This slot is booked. Cancelling also cancels the player's booking, so please WhatsApp them. Cancel it?"
          : "Cancel this slot?";
        if (!window.confirm(msg)) e.preventDefault();
      }}
      className="rounded-lg border border-black/15 px-2.5 py-1 text-xs font-medium text-red-700 disabled:opacity-50"
    >
      {pending ? "Cancelling…" : "Cancel slot"}
    </button>
  );
}
