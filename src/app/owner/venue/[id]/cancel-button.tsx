"use client";

import { useFormStatus } from "react-dom";

// For an open (unbooked) slot that's been sold through another channel.
export function CancelSlotButton({ booked }: { booked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending || booked}
      onClick={(e) => {
        if (!window.confirm("Remove this slot? Players will no longer see it.")) e.preventDefault();
      }}
      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
    >
      {pending ? "Removing…" : "Sold elsewhere / remove"}
    </button>
  );
}
